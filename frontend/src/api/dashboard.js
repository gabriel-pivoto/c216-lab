import { request } from "./client.js";

export function getDashboardSummary() {
  return request("/dashboard/summary");
}
