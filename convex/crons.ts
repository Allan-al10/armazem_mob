import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// O minuto :00 é evitado para não coincidir com outros trabalhos agendados.
// O envio roda de hora em hora porque cada loja escolhe um horário local.
crons.hourly(
    "atualiza fiados atrasados",
    { minuteUTC: 5 },
    internal.reminders.refreshOverdueCredits,
);

crons.hourly(
    "envia avisos de fiado",
    { minuteUTC: 10 },
    internal.reminders.sendDueReminders,
);

export default crons;
