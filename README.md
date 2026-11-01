# AXLE: Vehicle Rental System

An object-oriented programming project in Java. A small Java server holds all the rental logic
(fleet, pricing, bookings, returns, late fees) and serves a website for it on `http://localhost:8080`.

Live demo: **https://axle-rose.vercel.app** (see [Online demo](#online-demo) for how it differs).

## Run it

Requirements: JDK 17+ and Node.js 18+ (Node is only needed the first time, to build the website).

Windows:

```
run.bat
```

Mac / Linux:

```
sh run.sh
```

Then open **http://localhost:8080**. The script builds the website into `web/` once, compiles the Java
sources and starts the server.

## Project layout

```
backend/src/   the Java project (11 files)
frontend/      the website (Vite, vanilla JS, GSAP, Lenis, three.js)
run.bat        build + compile + start (Windows)
run.sh         build + compile + start (Mac/Linux)
```

## Java classes

| Class | Role | OOP concept |
|---|---|---|
| `Vehicle` | Abstract base: private fields, getters, abstract `calculateRent(days)` | Abstraction, encapsulation |
| `Car`, `Bike`, `SUV` | Each overrides `calculateRent` with its own pricing | Inheritance, polymorphism |
| `Rentable` | `rent()` and `returnVehicle()`, implemented by `Vehicle` | Interface |
| `Customer` | Name and phone | Encapsulation |
| `Booking` | Has a `Vehicle` and a `Customer`, days and total | Composition |
| `RentalService` | `ArrayList<Vehicle>` and `ArrayList<Booking>`; book, return, late fee, filter | Collections |
| `VehicleNotAvailableException` | Thrown by `rent()` when a vehicle is already rented | Custom exception |
| `Server` | JDK `HttpServer`: JSON API + static website | Exception handling |
| `Main` | Sample fleet and server start-up | |

JSON is written by hand in each class's `toJson()`. Lookups use plain loops over `ArrayList`s.

### Pricing rules

| Class | Rule |
|---|---|
| Car | rate × days |
| Bike | rate × days, 20% off from 7 days |
| SUV | rate × days × 1.15 |
| Late return | (days used − days booked) × rate × 1.5 |

### API

| Endpoint | Does |
|---|---|
| `GET /api/vehicles?type=All\|Car\|Bike\|SUV` | List or filter the fleet |
| `GET /api/quote?id=S-01&days=5` | Price from `calculateRent()` |
| `POST /api/book?id=&name=&phone=&days=` | Create a booking (409 if already rented) |
| `POST /api/return?booking=AX-1001&days=4` | Return a vehicle, with late fee |
| `GET /api/bookings` | All bookings |

## The website

- **Opening film:** a Mercedes-AMG GT in a studio, rendered in Blender (Cycles) as 480 frames and played on a
  canvas as you scroll. Labels follow the wheel, headlight, badge and exhaust using positions exported per frame.
- **Rule book:** Car, Bike and SUV side by side with their `calculateRent()` code and live prices for the same
  number of days.
- **Fleet:** filter by type (done by `RentalService.filterByType()`), live availability.
- **Booking drawer:** three steps (days, details, confirm) and a receipt. The AMG GT and the Ford F-150 Raptor
  open as live 3D models you can drag to rotate.
- **My rentals:** return a vehicle with the number of days actually used; late fees are calculated by Java.

## Online demo

Vercel cannot run a Java server, so the online version is a demo build (`npm run build:demo` in `frontend/`).
`frontend/src/demo.js` mirrors the Java pricing and booking rules in the browser, starting from a snapshot of the
Java server's data, and bookings are kept in the visitor's browser. Run the project locally to use the real
Java backend.

## Credits

- 3D models: "Mercedes-Benz AMG GT 2016" and "Ford F-150 Raptor" from Sketchfab, CC licences.
- Photos: Unsplash contributors.
- Fonts: General Sans (Fontshare), JetBrains Mono.
