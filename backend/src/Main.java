import java.io.File;

/**
 * Entry point: fills the fleet with sample data and starts the server.
 */
public class Main {

    public static void main(String[] args) throws Exception {
        RentalService service = new RentalService();

        service.addVehicle(new Car("C-01", "Mercedes-AMG GT", 22000, "4.0L V8 Biturbo", 2, "Petrol", "/img/car-amg.jpg"));
        service.addVehicle(new Car("C-02", "Audi R8 V10", 24000, "5.2L V10", 2, "Petrol", "/img/car-2.jpg"));
        service.addVehicle(new Car("C-03", "BMW M5", 16000, "4.4L V8 Turbo", 5, "Petrol", "/img/car-3.jpg"));
        service.addVehicle(new Car("C-04", "Toyota GR86", 7500, "2.4L Flat-4", 4, "Petrol", "/img/car-4.jpg"));
        service.addVehicle(new Car("C-05", "Chevrolet Camaro ZL1", 12000, "6.2L V8 Supercharged", 4, "Petrol", "/img/car-5.jpg"));

        service.addVehicle(new Bike("B-01", "Royal Enfield Continental GT", 1900, "648cc Twin", 2, "Petrol", "/img/bike-1.jpg"));
        service.addVehicle(new Bike("B-02", "Royal Enfield Interceptor", 1700, "648cc Twin", 2, "Petrol", "/img/bike-2.jpg"));
        service.addVehicle(new Bike("B-03", "Continental GT Black Ray", 2000, "648cc Twin", 2, "Petrol", "/img/bike-3.jpg"));
        service.addVehicle(new Bike("B-04", "Interceptor Café", 1800, "648cc Twin", 2, "Petrol", "/img/bike-4.jpg"));
        service.addVehicle(new Bike("B-05", "Continental GT Slipstream", 2100, "648cc Twin", 2, "Petrol", "/img/bike-5.jpg"));

        service.addVehicle(new SUV("S-01", "Volkswagen Tiguan Allspace", 6500, "2.0L TSI", 7, "Petrol", "/img/suv-1.jpg"));
        service.addVehicle(new SUV("S-02", "Audi RS Q8", 18000, "4.0L V8 Turbo", 5, "Petrol", "/img/suv-2.jpg"));
        service.addVehicle(new SUV("S-03", "Mazda CX-5", 5500, "2.5L Skyactiv", 5, "Petrol", "/img/suv-3.jpg"));
        service.addVehicle(new SUV("S-04", "Ford F-150 Raptor", 15000, "3.5L V6 EcoBoost", 5, "Petrol", "/img/suv-raptor.jpg"));
        service.addVehicle(new SUV("S-05", "Mercedes-Benz GLA 220d", 7000, "2.0L Diesel", 5, "Diesel", "/img/suv-5.jpg"));

        // One sample booking, so "My Rentals" isn't empty and the R8 is already taken.
        service.bookVehicle("C-02", "Demo Customer", "9800000000", 3);

        File webRoot = new File(args.length > 0 ? args[0] : "web");
        new Server(service, webRoot).start(8080);
    }
}
