import { AppError } from "../core/errors.js";
import { runDoctor, type DoctorCheck } from "../core/doctor.js";
import { jsonFailure, jsonSuccess, writeJson, writeOut } from "../core/output.js";

function formatCheck(item: DoctorCheck): string {
  return `[${item.status.toUpperCase()}] ${item.id}: ${item.message}`;
}

export async function doctorCommand(
  json: boolean,
  cwd: string = process.cwd(),
): Promise<number> {
  const report = await runDoctor(cwd);

  if (json) {
    if (report.healthy) {
      writeJson(jsonSuccess("doctor", report));
    } else {
      writeJson(
        jsonFailure(
          "doctor",
          new AppError("DOCTOR_FAILED", "One or more checks failed", {
            details: { checks: report.checks },
          }),
        ),
      );
    }
  } else {
    for (const item of report.checks) {
      writeOut(formatCheck(item));
    }
  }

  return report.healthy ? 0 : 1;
}
