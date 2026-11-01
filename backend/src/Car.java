/**
 * Inheritance: a Car IS-A Vehicle.
 * Pricing: the plain rate, rate x days.
 */
public class Car extends Vehicle {

    public Car(String id, String name, double ratePerDay,
               String engine, int seats, String fuel, String image) {
        super(id, name, ratePerDay, engine, seats, fuel, image);
    }

    @Override
    public double calculateRent(int days) {
        return getRatePerDay() * days;
    }

    @Override
    public String getType() {
        return "Car";
    }
}
