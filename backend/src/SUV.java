/**
 * Inheritance: an SUV IS-A Vehicle.
 * Pricing: 15% premium on top of the normal rate.
 */
public class SUV extends Vehicle {

    public SUV(String id, String name, double ratePerDay,
               String engine, int seats, String fuel, String image) {
        super(id, name, ratePerDay, engine, seats, fuel, image);
    }

    @Override
    public double calculateRent(int days) {
        return Math.round(getRatePerDay() * days * 1.15); // whole rupees
    }

    @Override
    public String getType() {
        return "SUV";
    }
}
