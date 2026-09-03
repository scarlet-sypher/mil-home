import bcrypt from "bcryptjs";
import { prisma } from "../client";
import { formatOrderRef } from "../../lib/order-ref";

const BCRYPT_COST = 12;

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// Spreads `total` records linearly from `maxDays` ago (index 0) up to today (the last
// index), so month-over-month dashboard trends have real historical variety instead of
// every row sharing the same "now" timestamp.
function spreadDaysAgo(index: number, total: number, maxDays: number) {
  return daysAgo(Math.round((index / (total - 1)) * maxDays));
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.auditEvent.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.vacation.deleteMany();
  await prisma.allotment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.quarter.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  const passwordHash = await bcrypt.hash("MilHome@2026", BCRYPT_COST);
  const admin = await prisma.user.create({
    data: { email: "admin@milhome.local", username: "admin", passwordHash },
  });
  await prisma.user.create({
    data: { email: "housing.officer@milhome.local", username: "housing.officer", passwordHash },
  });

  async function log(action: string, entity: string, entityId?: number, details?: string, when?: Date) {
    await prisma.auditEvent.create({
      data: { actor: admin.email, action, entity, entityId, details, createdAt: when ?? new Date() },
    });
  }

  console.log("Creating quarters...");
  const quarterDefs = [
    { colony: "Officers Colony", quarterNo: "OC-101" },
    { colony: "Officers Colony", quarterNo: "OC-102" },
    { colony: "Officers Colony", quarterNo: "OC-103" },
    { colony: "Officers Colony", quarterNo: "OC-104" },
    { colony: "Officers Colony", quarterNo: "OC-105" },
    { colony: "JCO Colony", quarterNo: "JC-201" },
    { colony: "JCO Colony", quarterNo: "JC-202" },
    { colony: "JCO Colony", quarterNo: "JC-203" },
    { colony: "JCO Colony", quarterNo: "JC-204" },
    { colony: "JCO Colony", quarterNo: "JC-205" },
    { colony: "Havildar Lines", quarterNo: "HL-301" },
    { colony: "Havildar Lines", quarterNo: "HL-302" },
    { colony: "Havildar Lines", quarterNo: "HL-303" },
    { colony: "Havildar Lines", quarterNo: "HL-304" },
    { colony: "Havildar Lines", quarterNo: "HL-305" },
    { colony: "Sepoy Lines", quarterNo: "SL-401" },
    { colony: "Sepoy Lines", quarterNo: "SL-402" },
    { colony: "Sepoy Lines", quarterNo: "SL-403" },
    { colony: "Sepoy Lines", quarterNo: "SL-404" },
    { colony: "Sepoy Lines", quarterNo: "SL-405" },
    { colony: "Sepoy Lines", quarterNo: "SL-406" },
    { colony: "Sepoy Lines", quarterNo: "SL-407" },
    { colony: "Sepoy Lines", quarterNo: "SL-408" },
    { colony: "Sepoy Lines", quarterNo: "SL-409" },
    { colony: "Sepoy Lines", quarterNo: "SL-410" },
  ];
  const quarters: Record<string, { id: number }> = {};
  for (const [index, def] of quarterDefs.entries()) {
    quarters[def.quarterNo] = await prisma.quarter.create({
      data: { ...def, condition: "FIT", createdAt: spreadDaysAgo(index, quarterDefs.length, 420) },
    });
  }

  console.log("Creating applicants...");
  const applicantDefs = [
    // Currently allotted and occupying a quarter (10)
    { serviceNo: "IC-45210K", name: "Vikram Rathore", rank: "Major", unit: "5 GRENADIERS", seniorityDate: "2011-03-12" },
    { serviceNo: "IC-46830L", name: "Arjun Nair", rank: "Captain", unit: "14 MADRAS", seniorityDate: "2014-07-01" },
    { serviceNo: "IC-48120M", name: "Karan Mehta", rank: "Lt Col", unit: "Army Ordnance Corps", seniorityDate: "2005-04-22" },
    { serviceNo: "JC-201456", name: "Suresh Yadav", rank: "Subedar", unit: "2 SIKH LI", seniorityDate: "2009-01-20" },
    { serviceNo: "JC-203789", name: "Ramesh Chauhan", rank: "Nb Subedar", unit: "Corps of Signals", seniorityDate: "2012-11-05" },
    { serviceNo: "3245678H", name: "Manoj Tiwari", rank: "Havildar", unit: "9 PARA", seniorityDate: "2013-06-18" },
    { serviceNo: "3298761N", name: "Deepak Rawat", rank: "Naik", unit: "16 CAVALRY", seniorityDate: "2016-09-09" },
    { serviceNo: "3311209S", name: "Ajay Bisht", rank: "Sepoy", unit: "5 GRENADIERS", seniorityDate: "2018-02-14" },
    { serviceNo: "3350012S", name: "Rohit Sharma", rank: "Sepoy", unit: "14 MADRAS", seniorityDate: "2019-08-30" },
    { serviceNo: "3402987N", name: "Vinod Kumar", rank: "Naik", unit: "Army Medical Corps", seniorityDate: "2017-05-11" },
    // Pending allotment, awaiting approval (3)
    { serviceNo: "IC-49900P", name: "Sandeep Malik", rank: "Captain", unit: "16 CAVALRY", seniorityDate: "2015-10-02" },
    { serviceNo: "3421009H", name: "Anil Kumar Gupta", rank: "Havildar", unit: "2 SIKH LI", seniorityDate: "2010-12-19" },
    { serviceNo: "3455678S", name: "Pankaj Joshi", rank: "Sepoy", unit: "9 PARA", seniorityDate: "2020-01-15" },
    // Rejected allotment, back on the waiting list (2)
    { serviceNo: "3524567H", name: "Bhupendra Rana", rank: "Havildar", unit: "5 GRENADIERS", seniorityDate: "2011-07-07" },
    { serviceNo: "3535678N", name: "Kishore Thapa", rank: "Naik", unit: "14 MADRAS", seniorityDate: "2019-03-21" },
    // Previously occupied, now back on the waiting list (2)
    { serviceNo: "JC-209988", name: "Harpreet Singh", rank: "Subedar", unit: "16 CAVALRY", seniorityDate: "2010-05-16" },
    { serviceNo: "3546789S", name: "Om Prakash", rank: "Sepoy", unit: "Corps of Signals", seniorityDate: "2018-10-10" },
    // Pure waiting list, no allotment yet (8)
    { serviceNo: "3467890N", name: "Sunil Dutt", rank: "Naik", unit: "5 GRENADIERS", seniorityDate: "2016-03-03" },
    { serviceNo: "IC-50210K", name: "Rajeev Bhatt", rank: "Major", unit: "Corps of Signals", seniorityDate: "2008-06-27" },
    { serviceNo: "3489012S", name: "Mahesh Prasad", rank: "Sepoy", unit: "14 MADRAS", seniorityDate: "2021-04-08" },
    { serviceNo: "JC-207654", name: "Devendra Singh", rank: "Subedar", unit: "16 CAVALRY", seniorityDate: "2013-09-14" },
    { serviceNo: "3491234H", name: "Ashok Kumar", rank: "Havildar", unit: "Army Ordnance Corps", seniorityDate: "2014-02-25" },
    { serviceNo: "3502345N", name: "Naresh Pal", rank: "Naik", unit: "9 PARA", seniorityDate: "2017-11-30" },
    { serviceNo: "3513456S", name: "Gopal Krishna", rank: "Sepoy", unit: "2 SIKH LI", seniorityDate: "2022-06-06" },
    { serviceNo: "IC-51600L", name: "Yogesh Verma", rank: "Captain", unit: "Army Medical Corps", seniorityDate: "2016-08-19" },
  ];
  const applicants: Record<string, { id: number; serviceNo: string; name: string; rank: string; unit: string }> = {};
  for (const [index, def] of applicantDefs.entries()) {
    applicants[def.serviceNo] = await prisma.applicant.create({
      data: {
        ...def,
        seniorityDate: new Date(def.seniorityDate),
        createdAt: spreadDaysAgo(index, applicantDefs.length, 220),
      },
    });
  }

  console.log("Allotting and approving currently-occupied quarters...");
  const occupied = [
    { serviceNo: "IC-45210K", quarterNo: "OC-101" },
    { serviceNo: "IC-46830L", quarterNo: "OC-102" },
    { serviceNo: "IC-48120M", quarterNo: "OC-103" },
    { serviceNo: "JC-201456", quarterNo: "JC-201" },
    { serviceNo: "JC-203789", quarterNo: "JC-202" },
    { serviceNo: "3245678H", quarterNo: "HL-301" },
    { serviceNo: "3298761N", quarterNo: "HL-302" },
    { serviceNo: "3311209S", quarterNo: "SL-401" },
    { serviceNo: "3350012S", quarterNo: "SL-402" },
    { serviceNo: "3402987N", quarterNo: "SL-403" },
  ];
  for (const { serviceNo, quarterNo } of occupied) {
    const applicant = applicants[serviceNo];
    const quarter = quarters[quarterNo];
    const created = await prisma.allotment.create({
      data: { applicantId: applicant.id, quarterId: quarter.id, createdAt: daysAgo(60) },
    });
    const orderRef = formatOrderRef(created.id);
    await prisma.allotment.update({ where: { id: created.id }, data: { authorityStatus: "APPROVED", orderRef } });
    await prisma.applicant.update({ where: { id: applicant.id }, data: { status: "ALLOTTED" } });
    await prisma.quarter.update({
      where: { id: quarter.id },
      data: { status: "OCCUPIED", serviceNo: applicant.serviceNo, rank: applicant.rank, name: applicant.name, unit: applicant.unit },
    });
    await log("CREATE", "ALLOTMENT", created.id, undefined, daysAgo(60));
    await log("APPROVE", "ALLOTMENT", created.id, orderRef, daysAgo(59));
  }

  console.log("Creating pending allotments...");
  const pending = [
    { serviceNo: "IC-49900P", quarterNo: "JC-203" },
    { serviceNo: "3421009H", quarterNo: "HL-303" },
    { serviceNo: "3455678S", quarterNo: "SL-404" },
  ];
  for (const { serviceNo, quarterNo } of pending) {
    const applicant = applicants[serviceNo];
    const quarter = quarters[quarterNo];
    const created = await prisma.allotment.create({
      data: { applicantId: applicant.id, quarterId: quarter.id, createdAt: daysAgo(2) },
    });
    await prisma.quarter.update({ where: { id: quarter.id }, data: { status: "RESERVED" } });
    await log("CREATE", "ALLOTMENT", created.id, undefined, daysAgo(2));
  }

  console.log("Creating rejected allotments...");
  const rejected = [
    { serviceNo: "3524567H", quarterNo: "OC-104" },
    { serviceNo: "3535678N", quarterNo: "SL-405" },
  ];
  for (const { serviceNo, quarterNo } of rejected) {
    const applicant = applicants[serviceNo];
    const quarter = quarters[quarterNo];
    const created = await prisma.allotment.create({
      data: { applicantId: applicant.id, quarterId: quarter.id, createdAt: daysAgo(10) },
    });
    await prisma.allotment.update({ where: { id: created.id }, data: { authorityStatus: "REJECTED" } });
    await log("CREATE", "ALLOTMENT", created.id, undefined, daysAgo(10));
    await log("REJECT", "ALLOTMENT", created.id, undefined, daysAgo(9));
  }

  console.log("Creating an administratively unallocated quarter...");
  {
    const applicant = applicants["JC-209988"];
    const quarter = quarters["JC-204"];
    const created = await prisma.allotment.create({
      data: { applicantId: applicant.id, quarterId: quarter.id, createdAt: daysAgo(90) },
    });
    const orderRef = formatOrderRef(created.id);
    await prisma.allotment.update({ where: { id: created.id }, data: { authorityStatus: "APPROVED", orderRef } });
    await log("CREATE", "ALLOTMENT", created.id, undefined, daysAgo(90));
    await log("APPROVE", "ALLOTMENT", created.id, orderRef, daysAgo(89));

    await prisma.allotment.update({ where: { id: created.id }, data: { authorityStatus: "UNALLOCATED" } });
    await prisma.applicant.update({ where: { id: applicant.id }, data: { status: "WAITING" } });
    await prisma.quarter.update({
      where: { id: quarter.id },
      data: { status: "VACANT", serviceNo: null, rank: null, name: null, unit: null },
    });
    await log("UNALLOCATE", "ALLOTMENT", created.id, undefined, daysAgo(15));
  }

  console.log("Filing complaints against currently-occupied quarters...");
  const complaintDefs = [
    { serviceNo: "IC-45210K", quarterNo: "OC-101", description: "Water leakage in the bathroom ceiling", status: "OPEN" },
    { serviceNo: "IC-46830L", quarterNo: "OC-102", description: "Kitchen exhaust fan not working", status: "IN_PROGRESS", remark: "Electrician visiting on Monday" },
    { serviceNo: "IC-48120M", quarterNo: "OC-103", description: "Broken window pane in the study", status: "CLOSED", remark: "Replaced and verified" },
    { serviceNo: "JC-201456", quarterNo: "JC-201", description: "Termite infestation in wooden almirah", status: "WAITING", remark: "Waiting for pest control slot" },
    { serviceNo: "JC-203789", quarterNo: "JC-202", description: "Main door lock jammed", status: "BLOCKED", remark: "Locksmith unavailable this week" },
    { serviceNo: "3245678H", quarterNo: "HL-301", description: "Ceiling fan making loud noise", status: "OPEN" },
    { serviceNo: "3298761N", quarterNo: "HL-302", description: "Leaking kitchen tap", status: "CLOSED", remark: "Fixed, new washer installed" },
    { serviceNo: "3311209S", quarterNo: "SL-401", description: "Bathroom geyser not heating", status: "IN_PROGRESS", remark: "Technician diagnosed a faulty thermostat" },
  ];
  for (const [i, c] of complaintDefs.entries()) {
    const applicant = applicants[c.serviceNo];
    const quarter = quarters[c.quarterNo];
    const created = await prisma.complaint.create({
      data: {
        applicantId: applicant.id,
        quarterId: quarter.id,
        description: c.description,
        status: c.status,
        remark: c.remark ?? null,
        closedAt: c.status === "CLOSED" ? daysAgo(1) : null,
        createdAt: daysAgo(20 - i),
      },
    });
    await log("CREATE", "COMPLAINT", created.id, c.description, daysAgo(20 - i));
    if (c.remark) await log("UPDATE", "COMPLAINT", created.id, `status -> ${c.status}`, daysAgo(10 - i));
  }

  console.log("Starting and completing maintenance cycles...");
  // Currently in progress
  const inProgressMaintenance = [
    { quarterNo: "OC-103", remark: "Re-plastering damp wall in the living room" },
    { quarterNo: "JC-202", remark: "Replacing the main door lock assembly" },
  ];
  for (const m of inProgressMaintenance) {
    const quarter = await prisma.quarter.findUniqueOrThrow({ where: { id: quarters[m.quarterNo].id } });
    await prisma.maintenanceRecord.create({
      data: {
        quarterId: quarter.id,
        colony: quarter.colony,
        quarterNo: quarter.quarterNo,
        statusBeforeMaintenance: quarter.status,
        condition: quarter.condition,
        serviceNo: quarter.serviceNo,
        rank: quarter.rank,
        name: quarter.name,
        unit: quarter.unit,
        remark: m.remark,
        startedAt: daysAgo(3),
      },
    });
    await prisma.quarter.update({ where: { id: quarter.id }, data: { underMaintenance: true } });
    await log("MAINTENANCE_START", "QUARTER", quarter.id, m.remark, daysAgo(3));
  }

  // Completed history
  const completedMaintenance = [
    { quarterNo: "JC-205", remark: "Annual whitewash and pest treatment", completedRemark: "Completed on schedule", startedDaysAgo: 45, endedDaysAgo: 40 },
    { quarterNo: "SL-406", remark: "Roof waterproofing before monsoon", completedRemark: "Waterproofing done, no leaks found after test", startedDaysAgo: 80, endedDaysAgo: 74 },
    { quarterNo: "SL-406", remark: "Electrical wiring upgrade", completedRemark: "Rewired and load-tested successfully", startedDaysAgo: 25, endedDaysAgo: 21 },
    { quarterNo: "OC-102", remark: "Pre-occupancy refurbishment", completedRemark: "Painted and fittings replaced before allotment", startedDaysAgo: 68, endedDaysAgo: 62 },
  ];
  for (const m of completedMaintenance) {
    const quarter = await prisma.quarter.findUniqueOrThrow({ where: { id: quarters[m.quarterNo].id } });
    await prisma.maintenanceRecord.create({
      data: {
        quarterId: quarter.id,
        colony: quarter.colony,
        quarterNo: quarter.quarterNo,
        statusBeforeMaintenance: "VACANT",
        condition: "FIT",
        remark: m.remark,
        status: "COMPLETED",
        completedRemark: m.completedRemark,
        startedAt: daysAgo(m.startedDaysAgo),
        endedAt: daysAgo(m.endedDaysAgo),
      },
    });
    await log("MAINTENANCE_START", "QUARTER", quarter.id, m.remark, daysAgo(m.startedDaysAgo));
    await log("MAINTENANCE_COMPLETE", "QUARTER", quarter.id, m.completedRemark, daysAgo(m.endedDaysAgo));
  }

  console.log("Requesting vacations...");
  // Pending, not yet inspected
  const pendingVacations = [
    { serviceNo: "3350012S", quarterNo: "SL-402" },
    { serviceNo: "3402987N", quarterNo: "SL-403" },
  ];
  for (const v of pendingVacations) {
    const created = await prisma.vacation.create({
      data: { applicantId: applicants[v.serviceNo].id, quarterId: quarters[v.quarterNo].id, requestDate: daysAgo(2) },
    });
    await log("CREATE", "VACATION", created.id, undefined, daysAgo(2));
  }

  // Inspected with defects, still occupied
  const defectVacations = [
    { serviceNo: "JC-201456", quarterNo: "JC-201", defects: "Cracked bathroom tiles and a broken cupboard hinge" },
    { serviceNo: "3245678H", quarterNo: "HL-301", defects: "Damaged window screen and chipped paint in the hallway" },
  ];
  for (const v of defectVacations) {
    const created = await prisma.vacation.create({
      data: {
        applicantId: applicants[v.serviceNo].id,
        quarterId: quarters[v.quarterNo].id,
        requestDate: daysAgo(6),
        inspectionStatus: "INSPECTED",
        defects: v.defects,
        clearanceStatus: "DEFECTS",
      },
    });
    await log("CREATE", "VACATION", created.id, undefined, daysAgo(6));
    await log("INSPECT", "VACATION", created.id, v.defects, daysAgo(5));
  }

  // Inspected, cleared, and vacated
  console.log("Vacating and clearing a quarter...");
  {
    const applicant = applicants["3546789S"];
    const quarter = quarters["HL-304"];
    const created = await prisma.allotment.create({
      data: { applicantId: applicant.id, quarterId: quarter.id, createdAt: daysAgo(120) },
    });
    const orderRef = formatOrderRef(created.id);
    await prisma.allotment.update({ where: { id: created.id }, data: { authorityStatus: "APPROVED", orderRef } });
    await log("CREATE", "ALLOTMENT", created.id, undefined, daysAgo(120));
    await log("APPROVE", "ALLOTMENT", created.id, orderRef, daysAgo(119));

    await prisma.quarter.update({
      where: { id: quarter.id },
      data: { status: "OCCUPIED", serviceNo: applicant.serviceNo, rank: applicant.rank, name: applicant.name, unit: applicant.unit },
    });
    await prisma.applicant.update({ where: { id: applicant.id }, data: { status: "ALLOTTED" } });

    const vacation = await prisma.vacation.create({
      data: {
        applicantId: applicant.id,
        quarterId: quarter.id,
        requestDate: daysAgo(14),
        inspectionStatus: "INSPECTED",
        defects: null,
        clearanceStatus: "CLEARED",
      },
    });
    await log("CREATE", "VACATION", vacation.id, undefined, daysAgo(14));
    await log("INSPECT", "VACATION", vacation.id, "No defects found", daysAgo(12));

    await prisma.quarter.update({
      where: { id: quarter.id },
      data: { status: "VACANT", serviceNo: null, rank: null, name: null, unit: null },
    });
    await prisma.applicant.update({ where: { id: applicant.id }, data: { status: "WAITING" } });
  }

  console.log("Seed complete.");
  console.log("Login with: admin@milhome.local / MilHome@2026");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
