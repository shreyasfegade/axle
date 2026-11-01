/**
 * Abstraction + Encapsulation.
 *
 * Vehicle is abstract: you can never create a plain "Vehicle", only a Car, Bike or SUV.
 * All fields are private and are read through getters.
 * Each subclass must decide its own price by overriding calculateRent().
 */
public abstract class Vehicle implements Rentable {

    private String id;
    private String name;
    private double ratePerDay;
    private String engine;
    private int seats;
    private String fuel;
    private String image;
    private boolean available;

    public Vehicle(String id, String name, double ratePerDay,
                   String engine, int seats, String fuel, String image) {
        this.id = id;
        this.name = name;
        this.ratePerDay = ratePerDay;
        this.engine = engine;
        this.seats = seats;
        this.fuel = fuel;
        this.image = image;
        this.available = true;
    }

    // Every subclass gives its own pricing rule (polymorphism).
    public abstract double calculateRent(int days);

    // Every subclass says what kind of vehicle it is: "Car", "Bike" or "SUV".
    public abstract String getType();

    @Override
    public void rent() throws VehicleNotAvailableException {
        if (!available) {
            throw new VehicleNotAvailableException(name + " is already rented. Pick another vehicle.");
        }
        available = false;
    }

    @Override
    public void returnVehicle() {
        available = true;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public double getRatePerDay() { return ratePerDay; }
    public String getEngine() { return engine; }
    public int getSeats() { return seats; }
    public String getFuel() { return fuel; }
    public String getImage() { return image; }
    public boolean isAvailable() { return available; }

    // Hand-written JSON so the website can read this vehicle.
    public String toJson() {
        return "{"
                + "\"id\":\"" + id + "\","
                + "\"name\":\"" + name + "\","
                + "\"type\":\"" + getType() + "\","
                + "\"ratePerDay\":" + ratePerDay + ","
                + "\"engine\":\"" + engine + "\","
                + "\"seats\":" + seats + ","
                + "\"fuel\":\"" + fuel + "\","
                + "\"image\":\"" + image + "\","
                + "\"available\":" + available
                + "}";
    }
}
