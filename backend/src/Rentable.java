/**
 * Interface: anything that can be rented and returned.
 * Vehicle implements this, so every Car, Bike and SUV is Rentable.
 */
public interface Rentable {

    void rent() throws VehicleNotAvailableException;

    void returnVehicle();
}
