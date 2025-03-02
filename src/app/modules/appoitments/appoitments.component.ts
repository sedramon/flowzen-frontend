import { Component, ViewEncapsulation } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list'; // dodatni plugin za list view

@Component({
  selector: 'app-appoitments',
  standalone: true,
  imports: [FlexLayoutModule, FullCalendarModule],
  templateUrl: './appoitments.component.html',
  styleUrls: ['./appoitments.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppoitmentsComponent {
  calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' // omogućava list view za nedelju
    },
    editable: true,
    droppable: true,
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: false } as const,
    eventColor: '#378006',
    // Primer događaja
    events: [
      { title: 'Termin 1', date: '2025-03-01' },
      { title: 'Termin 2', date: '2025-03-02' }
    ],
    // Callback primeri za dodatnu interaktivnost:
    dateClick: (info: any) => {
      console.log('Datum kliknut: ', info.dateStr);
    },
    eventClick: (info: any) => {
      console.log('Klik na događaj: ', info.event.title);
    }
  };
}
