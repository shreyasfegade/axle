import java.util.ArrayList;

/**
 * All the business logic lives here.
 * Collections: two ArrayLists. Items are found with a plain for-each loop.
 */
public class RentalService {

    // Late days cost 1.5x the daily rate.
    public static final double LATE_MULTIPLIER = 1.5;

    private ArrayList<Vehicle> fleet = new ArrayList<>();
    private ArrayList<Booking> bookings = new ArrayList<>();
    private int nextBookingNumber = 1001;

    public void addVehicle(Vehicle v) {
        fleet.add(v);
    }

    public ArrayList<Vehicle> getFleet() {
        return fleet;
    }

    public ArrayList<Booking> getBookings() {
        return bookings;
    }

    public Vehicle findVehicle(String id) {
        for (Vehicle v : fleet) {
            if (v.getId().equals(id)) {
                return v;
            }
        }
        return null;
    }

    public Booking findBooking(String id) {
        for (Booking b : bookings) {
            if (b.getId().equals(id)) {
                return b;
            }
        }
        return null;
    }

    // Filter by "Car", "Bike" or "SUV". "All" returns everything.
    public ArrayList<Vehicle> filterByType(String type) {
        ArrayList<Vehicle> result = new ArrayList<>();
        for (Vehicle v : fleet) {
            if (type.equals("All") || v.getType().equals(type)) {
                result.add(v);
            }
        }
        return result;
    }

    // Price for a vehicle and number of days. Same days, different answer per subclass.
    public double quote(String vehicleId, int days) {
        Vehicle v = findVehicle(vehicleId);
        if (v == null) {
            throw new IllegalArgumentException("No vehicle with id " + vehicleId);
        }
        checkDays(days);
        return v.calculateRent(days);
    }

    public Booking bookVehicle(String vehicleId, String name, String phone, int days)
            throws VehicleNotAvailableException {
        Vehicle v = findVehicle(vehicleId);
        if (v == null) {
            throw new IllegalArgumentException("No vehicle with id " + vehicleId);
        }
        if (name.trim().isEmpty() || phone.trim().isEmpty()) {
            throw new IllegalArgumentException("Name and phone are required.");
        }
        checkDays(days);

        v.rent(); // throws VehicleNotAvailableException if already rented

        Booking b = new Booking("AX-" + nextBookingNumber, v, new Customer(name, phone), days);
        nextBookingNumber++;
        bookings.add(b);
        return b;
    }

    // Late fee: every day over the booked days costs rate x 1.5.
    public double calculateLateFee(Booking b, int actualDays) {
        int extraDays = actualDays - b.getDays();
        if (extraDays <= 0) {
            return 0;
        }
        return extraDays * b.getVehicle().getRatePerDay() * LATE_MULTIPLIER;
    }

    public Booking returnVehicle(String bookingId, int actualDays) {
        Booking b = findBooking(bookingId);
        if (b == null) {
            throw new IllegalArgumentException("No booking with id " + bookingId);
        }
        if (!b.isActive()) {
            throw new IllegalArgumentException("Booking " + bookingId + " was already returned.");
        }
        checkDays(actualDays);

        double fee = calculateLateFee(b, actualDays);
        b.close(actualDays, fee);
        b.getVehicle().returnVehicle();
        return b;
    }

    private void checkDays(int days) {
        if (days < 1 || days > 30) {
            throw new IllegalArgumentException("Days must be between 1 and 30.");
        }
    }
}
