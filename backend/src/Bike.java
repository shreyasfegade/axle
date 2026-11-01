/**
 * Inheritance: a Bike IS-A Vehicle.
 * Pricing: 20% discount when rented for 7 days or more.
 */
public class Bike extends Vehicle {

    public Bike(String id, String name, double ratePerDay,
                String engine, int seats, String fuel, String image) {
        super(id, name, ratePerDay, engine, seats, fuel, image);
    }

    @Override
    public double calculateRent(int days) {
        double total = getRatePerDay() * days;
        if (days >= 7) {
            total = total * 0.80;
        }
        return Math.round(total); // whole rupees
    }

    @Override
    public String getType() {
        return "Bike";
    }
}
