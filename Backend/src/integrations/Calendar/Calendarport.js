class CalendarPort {
  async addEvent({ title, start, end, attendeeEmail }) { throw new Error("Not implemented"); }
}
module.exports = CalendarPort;

// GoogleCalendarAdapter.js (adapts Google SDK to CalendarPort)
const CalendarPort = require('C:\Users\adith\OneDrive\Desktop\IFN636_Assignment2\Backend\src\integrations\Calendar\Calendarport.js');
class GoogleCalendarAdapter extends CalendarPort {
  constructor(googleClient){ super(); this.google = googleClient; }
  async addEvent({ title, start, end, attendeeEmail }){
    // translate to Google Calendar API calls here
    return { provider:"google", id:"evt_123" };
  }
}
module.exports = GoogleCalendarAdapter;