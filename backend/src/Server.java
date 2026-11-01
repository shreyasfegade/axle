import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;

/**
 * A tiny web server using the JDK's built-in HttpServer.
 * - /api/... returns JSON produced by our classes' toJson() methods.
 * - every other path returns a file from the web/ folder (the built website).
 *
 * The JDK's server receives requests and calls handle(); we never create threads ourselves.
 */
public class Server {

    private RentalService service;
    private File webRoot;

    public Server(RentalService service, File webRoot) {
        this.service = service;
        this.webRoot = webRoot;
    }

    public void start(int port) throws IOException {
        HttpServer http = HttpServer.create(new InetSocketAddress(port), 0);
        http.createContext("/", this::handle);
        http.start();
        System.out.println("AXLE is running at http://localhost:" + port);
    }

    private void handle(HttpExchange ex) throws IOException {
        String path = ex.getRequestURI().getPath();
        try {
            if (path.startsWith("/api/")) {
                handleApi(ex, path);
            } else {
                serveFile(ex, path);
            }
        } catch (Exception e) {
            send(ex, 500, "application/json", error(e.getMessage()));
        }
    }

    private void handleApi(HttpExchange ex, String path) throws IOException {
        String q = ex.getRequestURI().getRawQuery();

        try {
            if (path.equals("/api/vehicles")) {
                String type = param(q, "type");
                ArrayList<Vehicle> list = service.filterByType(type == null ? "All" : type);
                sendJson(ex, 200, vehiclesJson(list));

            } else if (path.equals("/api/quote")) {
                String id = param(q, "id");
                int days = Integer.parseInt(param(q, "days"));
                Vehicle v = service.findVehicle(id);
                double total = service.quote(id, days);
                sendJson(ex, 200, "{\"id\":\"" + id + "\",\"type\":\"" + v.getType()
                        + "\",\"days\":" + days + ",\"total\":" + total + "}");

            } else if (path.equals("/api/book")) {
                Booking b = service.bookVehicle(param(q, "id"), nvl(param(q, "name")),
                        nvl(param(q, "phone")), Integer.parseInt(param(q, "days")));
                sendJson(ex, 200, b.toJson());

            } else if (path.equals("/api/return")) {
                Booking b = service.returnVehicle(param(q, "booking"),
                        Integer.parseInt(param(q, "days")));
                sendJson(ex, 200, b.toJson());

            } else if (path.equals("/api/bookings")) {
                sendJson(ex, 200, bookingsJson(service.getBookings()));

            } else {
                sendJson(ex, 404, error("Unknown endpoint " + path));
            }

        } catch (VehicleNotAvailableException e) {
            // Our custom exception: 409 Conflict, and the message goes to the UI.
            sendJson(ex, 409, error(e.getMessage()));
        } catch (NumberFormatException e) {
            sendJson(ex, 400, error("Days must be a whole number."));
        } catch (IllegalArgumentException e) {
            sendJson(ex, 400, error(e.getMessage()));
        }
    }

    private String vehiclesJson(ArrayList<Vehicle> list) {
        String json = "[";
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) json += ",";
            json += list.get(i).toJson();
        }
        return json + "]";
    }

    private String bookingsJson(ArrayList<Booking> list) {
        String json = "[";
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) json += ",";
            json += list.get(i).toJson();
        }
        return json + "]";
    }

    private String error(String message) {
        String safe = message == null ? "Something went wrong." : message.replace("\"", "'");
        return "{\"error\":\"" + safe + "\"}";
    }

    private String nvl(String s) {
        return s == null ? "" : s;
    }

    // Reads one value out of a query string like "id=C-01&days=5".
    private String param(String query, String key) {
        if (query == null) return null;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv[0].equals(key)) {
                return kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
            }
        }
        return null;
    }

    private void serveFile(HttpExchange ex, String path) throws IOException {
        if (path.equals("/")) path = "/index.html";
        File file = new File(webRoot, path);

        // Don't allow paths like /../../secret.txt to escape the web folder.
        boolean inside = file.getCanonicalPath().startsWith(webRoot.getCanonicalPath());
        if (!inside || !file.isFile()) {
            send(ex, 404, "text/plain", "Not found");
            return;
        }
        byte[] bytes = Files.readAllBytes(file.toPath());
        sendBytes(ex, 200, contentType(file.getName()), bytes);
    }

    private String contentType(String name) {
        if (name.endsWith(".html")) return "text/html; charset=utf-8";
        if (name.endsWith(".js")) return "text/javascript; charset=utf-8";
        if (name.endsWith(".css")) return "text/css; charset=utf-8";
        if (name.endsWith(".jpg")) return "image/jpeg";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".svg")) return "image/svg+xml";
        if (name.endsWith(".woff2")) return "font/woff2";
        if (name.endsWith(".woff")) return "font/woff";
        if (name.endsWith(".webp")) return "image/webp";
        if (name.endsWith(".json")) return "application/json";
        if (name.endsWith(".glb")) return "model/gltf-binary";
        if (name.endsWith(".wasm")) return "application/wasm";
        return "application/octet-stream";
    }

    private void sendJson(HttpExchange ex, int status, String json) throws IOException {
        send(ex, status, "application/json; charset=utf-8", json);
    }

    private void send(HttpExchange ex, int status, String type, String body) throws IOException {
        sendBytes(ex, status, type, body.getBytes(StandardCharsets.UTF_8));
    }

    private void sendBytes(HttpExchange ex, int status, String type, byte[] bytes) throws IOException {
        ex.getResponseHeaders().set("Content-Type", type);
        ex.sendResponseHeaders(status, bytes.length);
        OutputStream out = ex.getResponseBody();
        out.write(bytes);
        out.close();
    }
}
