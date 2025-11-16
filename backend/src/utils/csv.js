const { Readable } = require("stream");

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function studentsCsvStream(rows) {
  function* lines() {
    yield "Matric No,Full Name,Faculty,Department,Academic Year,Total Courses\r\n";
    for (const row of rows) {
      yield [
        escapeCsvValue(row.matric_no),
        escapeCsvValue(row.full_name),
        escapeCsvValue(row.faculty),
        escapeCsvValue(row.department),
        escapeCsvValue(row.academic_year),
        escapeCsvValue(row.total_courses),
      ].join(",") + "\r\n";
    }
  }

  return Readable.from(lines());
}

module.exports = {
  studentsCsvStream,
};
