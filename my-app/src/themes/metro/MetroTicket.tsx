// Metro theme: the contact chat is a ticket machine. These are its parts that only render in Metro:
// the LED prompt above the screen, and the slot below it that prints a ticket once a message is sent.

export interface PrintedTicket {
  no: number;
  name: string;
  message: string;
  when: string;
}

const PROMPT: Record<string, string> = {
  name: "Enter your name",
  email: "Enter your email",
  message: "Write your message",
  confirm: "Press send",
  sending: "Printing…",
  sent: "Take your ticket",
  failed: "Not sent · try again",
};

/** The amber LED strip above the screen: what to do next. */
export function MetroTicketPrompt({ step }: { step: string }) {
  return (
    <span className="only-metro">
      <span className="metro-tm-display" data-step={step} aria-hidden="true">
        {PROMPT[step] ?? ""}
      </span>
    </span>
  );
}

// A barcode that's the same for the same ticket number
function bars(no: number) {
  let x = no * 9301 + 49297;
  return Array.from({ length: 34 }, () => {
    x = (x * 9301 + 49297) % 233280;
    return 1 + Math.floor((x / 233280) * 3);
  });
}

/** The slot at the bottom of the machine, and the ticket it prints. */
export function MetroTicketSlot({ ticket }: { ticket: PrintedTicket | null }) {
  const excerpt = ticket && (ticket.message.length > 90 ? `${ticket.message.slice(0, 88).trimEnd()}…` : ticket.message);
  return (
    <span className="only-metro">
      <span className="metro-tm-slot" aria-hidden="true">
        <span className="metro-tm-mouth" />
        <span className="metro-tm-out">
          {ticket && (
            <span key={ticket.no} className="metro-tm-ticket">
              <span className="metro-tm-ticket-head">
                <span className="metro-badge">R</span>
                Rotana Line · Single journey
              </span>
              <span className="metro-tm-ticket-route">
                <span>
                  <small>From</small>
                  {ticket.name}
                </span>
                <span className="metro-tm-ticket-arrow">→</span>
                <span>
                  <small>To</small>
                  Rotana's inbox
                </span>
              </span>
              <span className="metro-tm-ticket-msg">“{excerpt}”</span>
              <span className="metro-tm-ticket-foot">
                <span>{ticket.when}</span>
                <span>No. {String(ticket.no).padStart(4, "0")}</span>
              </span>
              <span className="metro-tm-barcode">
                {bars(ticket.no).map((w, i) => (
                  <i key={i} style={{ width: w }} />
                ))}
              </span>
            </span>
          )}
        </span>
        <span className="metro-tm-label">{ticket ? "Ticket printed · reply on its way" : "Tickets"}</span>
      </span>
    </span>
  );
}
