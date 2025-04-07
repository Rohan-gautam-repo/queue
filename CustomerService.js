import FirebaseService from './FirebaseService';

const CustomerService = {
  joinQueue: async (customerData) => {
    try {
      // First, check if there's an available table
      const tables = await FirebaseService.getTables();
      const availableTables = tables.filter(t => t.status === "Available");
      
      // Find a suitable table for the customer
      const partySize = customerData.partySize || customerData.tableFor || 1;
      const suitableTable = availableTables
        .filter(table => table.capacity >= partySize)
        .sort((a, b) => a.capacity - b.capacity)[0];

      if (suitableTable) {
        // If a suitable table is available, assign it immediately
        const customer = await FirebaseService.joinQueue({
          ...customerData,
          status: "Assigned",
          tableNumber: suitableTable.number
        });
        
        // Update table status
        await FirebaseService.updateTableStatus(suitableTable.id, "Occupied");
        
        return {
          ...customer,
          message: `Assigned to Table ${suitableTable.number}`
        };
      } else {
        // If no suitable table is available, add to queue
        const customer = await FirebaseService.joinQueue({
          ...customerData,
          status: "Waiting"
        });
        
        return {
          ...customer,
          message: "Added to queue. You will be assigned a table when one becomes available."
        };
      }
    } catch (error) {
      console.error("Error joining queue:", error);
      throw error;
    }
  },

  getQueue: async () => {
    return FirebaseService.getQueue();
  },

  updateCustomerStatus: async (customerId, status, tableNumber = null) => {
    return FirebaseService.updateCustomerStatus(customerId, status, tableNumber);
  },

  clearQueue: async () => {
    return FirebaseService.clearQueue();
  },

  onQueueChange: (callback) => {
    return FirebaseService.onQueueChange(callback);
  },

  removeCustomer: async (customerId) => {
    return FirebaseService.removeCustomer(customerId);
  },

  // New method to try assigning tables automatically
  tryAssignTablesAutomatically: async () => {
    try {
      const [tables, customers] = await Promise.all([
        FirebaseService.getTables(),
        FirebaseService.getQueue()
      ]);

      const availableTables = tables.filter(t => t.status === "Available");
      const waitingCustomers = customers
        .filter(c => c.status === "Waiting")
        .sort((a, b) => {
          const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
          const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
          return timeA - timeB;
        });

      for (const customer of waitingCustomers) {
        const partySize = customer.partySize || customer.tableFor || 1;
        const suitableTable = availableTables
          .filter(table => table.capacity >= partySize)
          .sort((a, b) => a.capacity - b.capacity)[0];

        if (suitableTable) {
          // Assign the table to the customer
          await Promise.all([
            FirebaseService.updateCustomerStatus(customer.id, "Assigned", suitableTable.number),
            FirebaseService.updateTableStatus(suitableTable.id, "Occupied")
          ]);

          // Remove the assigned table from available tables
          availableTables.splice(availableTables.indexOf(suitableTable), 1);
        }
      }
    } catch (error) {
      console.error("Error in automatic table assignment:", error);
      throw error;
    }
  }
};

export default CustomerService;
