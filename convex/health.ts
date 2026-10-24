import { v } from "convex/values";
import { query } from "./_generated/server";

// Consulta simples para verificar se o backend está respondendo.
export const ping = query({
  args: {},
  returns: v.string(),
  handler: async () => "ok",
});
