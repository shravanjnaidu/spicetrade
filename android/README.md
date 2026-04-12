# SpiceTrade Android

An Android companion to the SpiceTrade iOS app — India's B2B spice marketplace.

## Stack

| Layer        | Technology                   |
| ------------ | ---------------------------- |
| Language     | Kotlin                       |
| UI           | Jetpack Compose + Material 3 |
| Navigation   | Navigation Compose           |
| Networking   | Retrofit 2 + OkHttp          |
| JSON         | Gson                         |
| Images       | Coil                         |
| Persistence  | DataStore Preferences        |
| Architecture | MVVM (ViewModel + StateFlow) |

## Features

- **Welcome screen** — animated feature carousel with sign-in / sign-up CTAs
- **Auth** — login and signup (buyer & seller roles)
- **Products** — grid listing with search, category chips, and sort options
- **Product detail** — image pager, reviews, wishlist toggle
- **Stores** — searchable store directory
- **Store detail** — store profile, business info, and their listings
- **Wishlist** — save / remove favourite products (buyers)
- **Seller dashboard** — listing management with stats, add/delete listings
- **Messaging** — conversation list and real-time-style chat
- **Profile** — user info with logout

## API

All data comes from **https://bigspice.in** (same backend as the iOS app).  
To point to a local server, change `BASE_URL` in  
`app/src/main/java/com/spicetrade/app/data/api/ApiConfig.kt`.

## Getting Started

1. Open the `android/` folder in **Android Studio Hedgehog (2023.1.1)** or later.
2. Let Gradle sync.
3. Run on an emulator or physical device (API 26+).

## Project Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   └── java/com/spicetrade/app/
│   │       ├── MainActivity.kt
│   │       ├── SpiceTradeApp.kt
│   │       ├── data/
│   │       │   ├── api/          ← Retrofit service, config, client
│   │       │   ├── models/       ← Data classes (mirrors iOS Models.swift)
│   │       │   └── preferences/  ← DataStore user session
│   │       ├── viewmodel/        ← AuthViewModel, ProductViewModel, …
│   │       └── ui/
│   │           ├── navigation/   ← NavGraph + Routes
│   │           ├── screens/      ← All screens (auth, products, stores, …)
│   │           └── theme/        ← Material 3 colour palette
│   └── build.gradle.kts
├── gradle/libs.versions.toml
└── settings.gradle.kts
```
