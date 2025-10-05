# FLIGHT SEARCH API

## Description

A flight search API integrated with a third party API [Amadeus] to retrieve flight information and display search results.

## Technologies Used


## Database persistence (MongoDB)

This project uses MongoDB via Mongoose. In development, if `MONGO_URI` is not set, the backend automatically starts an in-memory MongoDB (ephemeral) so you can test without installing Mongo. Data in the in-memory DB is lost on server restart.

To persist data to a real MongoDB instance (Atlas or local), create `backend/.env` (you can copy from `backend/.env.example`) and set:

```
MONGO_URI=mongodb://127.0.0.1:27017/flightdb
JWT_SECRET=your-strong-secret
PORT=5000
```

Or use your Atlas connection string for `MONGO_URI`.

Then start the backend and your data (users, bookings, passengers) will be stored in the specified MongoDB database.

Health check URL: http://localhost:5000/api/test
## Design

You can view the design and wireframes of the project on Figma:

- [Click here to view](https://www.figma.com/file/FSC6oEZ85iWekoCO5weufS/Flight-Website?node-id=0%3A1&mode=dev "Flight Search")

## Prequesites

- Node.js(16.x)
- React (18.x)

# Getting Started

1. Clone the Repository:

```bash
$ git clone https://github.com/dkrest1/flight-search-api.git
```

### Frontend

```bash
$ cd client
$ npm run dev
```

### Backend

create a .env file and put in the right credentials

```bash
$ cd server
$ cp .env.sample .env
$ npm run dev
```

### API documentation

http://localhost:3000/api-docs/
