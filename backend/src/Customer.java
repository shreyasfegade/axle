/**
 * Encapsulation: private fields, read only through getters.
 */
public class Customer {

    private String name;
    private String phone;

    public Customer(String name, String phone) {
        // Remove quotes and backslashes so the name can't break our hand-written JSON.
        this.name = name.replace("\"", "").replace("\\", "").trim();
        this.phone = phone.replace("\"", "").replace("\\", "").trim();
    }

    public String getName() { return name; }
    public String getPhone() { return phone; }

    public String toJson() {
        return "{\"name\":\"" + name + "\",\"phone\":\"" + phone + "\"}";
    }
}
