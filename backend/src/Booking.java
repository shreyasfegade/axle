/**
 * Composition (HAS-A): a Booking has a Vehicle and has a Customer.
 */
public class Booking {

    private String id;
    private Vehicle vehicle;
    private Customer customer;
    private int days;
    private double total;
    private boolean active;
    private int actualDays;
    private double lateFee;

    public Booking(String id, Vehicle vehicle, Customer customer, int days) {
        this.id = id;
        this.vehicle = vehicle;
        this.customer = customer;
        this.days = days;
        this.total = vehicle.calculateRent(days); // polymorphic call
        this.active = true;
        this.actualDays = 0;
        this.lateFee = 0;
    }

    // Called when the vehicle comes back.
    public void close(int actualDays, double lateFee) {
        this.actualDays = actualDays;
        this.lateFee = lateFee;
        this.active = false;
    }

    public String getId() { return id; }
    public Vehicle getVehicle() { return vehicle; }
    public Customer getCustomer() { return customer; }
    public int getDays() { return days; }
    public double getTotal() { return total; }
    public boolean isActive() { return active; }
    public int getActualDays() { return actualDays; }
    public double getLateFee() { return lateFee; }

    public String toJson() {
        return "{"
                + "\"id\":\"" + id + "\","
                + "\"vehicle\":" + vehicle.toJson() + ","
                + "\"customer\":" + customer.toJson() + ","
                + "\"days\":" + days + ","
                + "\"total\":" + total + ","
                + "\"active\":" + active + ","
                + "\"actualDays\":" + actualDays + ","
                + "\"lateFee\":" + lateFee
                + "}";
    }
}
