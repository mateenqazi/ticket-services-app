const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000; // You can change this port as needed.

app.use(bodyParser.json());

// Payment and Seat Reservation
const TicketPaymentService = {
  makePayment: (amount) => {
    console.log(`Payment of £${amount} made successfully.`);
    return true;
  },
};

const SeatReservationService = {
  reserveSeats: (numSeats) => {
    console.log(`${numSeats} seats reserved successfully.`);
    return true;
  },
};

// Business Rules
const TICKET_PRICES = {
  INFANT: 0,
  CHILD: 10,
  ADULT: 20,
};

// TicketService Logic
const TicketService = {
  calculateTotalAmount: (ticketRequests) => {
    let totalAmount = 0;
    let numAdultTickets = 0;

    for (const ticketRequest of ticketRequests) {
      if (ticketRequest.type === 'INFANT') {
        // Infants do not pay for a ticket
        continue;
      } else if (ticketRequest.type === 'ADULT') {
        numAdultTickets++;
        totalAmount += TICKET_PRICES.ADULT;
      } else if (ticketRequest.type === 'CHILD') {
        if (numAdultTickets === 0) {
          // Child and Infant tickets cannot be purchased without an Adult ticket
          throw new Error('Child ticket cannot be purchased without an Adult ticket.');
        }
        totalAmount += TICKET_PRICES.CHILD;
      } else {
        // Invalid ticket type
        throw new Error(`Invalid ticket type: ${ticketRequest.type}`);
      }
    }

    if (numAdultTickets === 0) {
      throw new Error('At least one Adult ticket must be purchased.');
    }

    if (totalAmount > 0 && totalAmount <= 20 * TICKET_PRICES.ADULT) {
      return totalAmount;
    } else {
      throw new Error('Invalid ticket purchase request.');
    }
  },

  purchaseTickets: (req, res) => {
    const ticketRequests = req.body;
    try {
      const totalAmount = TicketService.calculateTotalAmount(ticketRequests);

      // Make payment request to the TicketPaymentService
      const paymentSuccess = TicketPaymentService.makePayment(totalAmount);

      if (paymentSuccess) {
        // Calculate the number of seats to reserve (excluding infants)
        const numSeatsToReserve = ticketRequests.filter((request) => request.type !== 'INFANT').length;

        // Make seat reservation request to the SeatReservationService
        SeatReservationService.reserveSeats(numSeatsToReserve);

        res.status(200).json({
          message: 'Tickets purchased and seats reserved successfully.',
          numSeatsReserved: numSeatsToReserve,
          totalAmountPaid: totalAmount,
        });
      } else {
        res.status(500).json({ message: 'Payment failed.' });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

// Define the ticket purchase route
app.post('/purchase-tickets', TicketService.purchaseTickets);


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
