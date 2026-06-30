import { Router } from "express";
import { getLastWeekWorkingDays, parseDateParam } from "../shared/dateRange.js";
import { computeAllMetrics } from "./metrics/index.js";
import { fetchTeamMetricsData, fetchTeams } from "./fetch.js";
export const apiRouter = Router();

apiRouter.get("/teams", async (_req, res, next) => {
  try {
    const teams = await fetchTeams();
    res.json({ teams });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/metrics", async (req, res, next) => {
  try {
    const teamId = req.query.teamId;
    const fromParam = req.query.from;
    const toParam = req.query.to;

    if (typeof teamId !== "string" || !teamId) {
      res.status(400).json({ error: "teamId query parameter is required" });
      return;
    }

    const { from: defaultFrom, to: defaultTo } = getLastWeekWorkingDays();
    const from = parseDateParam(fromParam, defaultFrom);
    const to = parseDateParam(toParam, defaultTo, true);
    if (from > to) {
      res.status(400).json({ error: "from date must be before to date" });
      return;
    }

    const input = await fetchTeamMetricsData(teamId, from, to);
    const metrics = computeAllMetrics(input);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});
