/**
 * Custom checked exception.
 * Thrown when someone tries to rent a vehicle that is already rented.
 * Its message is sent to the website and shown on the vehicle card.
 */
public class VehicleNotAvailableException extends Exception {

    public VehicleNotAvailableException(String message) {
        super(message);
    }
}
