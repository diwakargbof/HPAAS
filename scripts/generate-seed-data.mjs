// Deterministic generator for tenants/dadus/seed-data.csv
// Reference "today" for the demo data: 2026-07-04.
import fs from "node:fs";

const TODAY = new Date("2026-07-04T12:00:00+05:30");
const DAY = 86400000;

// mulberry32 seeded PRNG — same output every run
let s = 42;
const rnd = () => {
  s |= 0; s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));

const CATALOG = {
  sweets: [["Kaju Katli", 275], ["Gulab Jamun", 180], ["Rasgulla", 160], ["Motichoor Ladoo", 200], ["Besan Ladoo", 190], ["Soan Papdi", 150], ["Milk Cake", 240], ["Rasmalai", 260], ["Jalebi", 120]],
  namkeen: [["Samosa", 20], ["Kachori", 25], ["Aloo Bhujia", 90], ["Mathri", 80], ["Dhokla", 110]],
  "gift-boxes": [["Assorted Sweets Box", 650], ["Premium Gift Box", 1200], ["Dry Fruit Sweets Box", 850]],
  "dry-fruits": [["Kaju 500g", 450], ["Badam 500g", 380], ["Pista 250g", 520]],
  bakery: [["Atta Biscuits", 60], ["Fruit Cake", 150]],
};
const STORES = ["DDU-CP", "DDU-GK", "DDU-NOIDA"];

const FIRST = ["Rajesh", "Sunita", "Amit", "Priya", "Vikram", "Neha", "Suresh", "Anita", "Rohit", "Kavita", "Manoj", "Pooja", "Deepak", "Ritu", "Sanjay", "Meena", "Arun", "Shalini", "Nitin", "Geeta", "Rahul", "Swati", "Ashok", "Rekha", "Varun", "Divya", "Mukesh", "Seema", "Karan", "Anjali", "Harish", "Nisha", "Gaurav", "Lata", "Pankaj", "Usha", "Tarun", "Sarita", "Yogesh", "Madhu", "Alok", "Preeti", "Naveen", "Shobha", "Vivek", "Kiran", "Ajay", "Sneha", "Ramesh", "Vandana", "Sachin", "Asha", "Dinesh", "Jyoti", "Prakash"];
const LAST = ["Sharma", "Gupta", "Verma", "Agarwal", "Singh", "Jain", "Mehta", "Kapoor", "Malhotra", "Bansal", "Chopra", "Arora", "Goel", "Mittal", "Saxena"];

let phoneSeq = 0;
function newPhone() {
  phoneSeq++;
  const prefix = pick(["98100", "99110", "98111", "97170", "88260", "96540", "78380", "99530"]);
  return prefix + String(10000 + phoneSeq * 37 + int(0, 9)).slice(-5);
}
// vary raw formats to exercise normalization
function formatPhone(p10, style) {
  switch (style % 5) {
    case 0: return p10;
    case 1: return `${p10.slice(0, 5)} ${p10.slice(5)}`;
    case 2: return `+91-${p10}`;
    case 3: return `0${p10}`;
    case 4: return `91${p10}`;
  }
}

function fmtDate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function basket(categories, big = false) {
  const n = big ? int(2, 4) : int(1, 3);
  const items = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    const cat = pick(categories);
    const [name, price] = pick(CATALOG[cat]);
    const qty = cat === "namkeen" ? int(4, 12) : int(1, big ? 3 : 2);
    items.push(`${name}|${cat}|${qty}|${price}`);
    total += qty * price;
  }
  return { cell: items.join("; "), total };
}

const customers = [];
function addCustomer(kind, opts = {}) {
  const fn = pick(FIRST), ln = pick(LAST);
  customers.push({
    kind,
    name: rnd() < 0.9 ? `${fn} ${ln}` : "",
    phone: newPhone(),
    email: rnd() < 0.45 ? `${fn.toLowerCase()}.${ln.toLowerCase()}${int(1, 99)}@gmail.com` : "",
    store: pick(STORES),
    ...opts,
  });
}

// archetypes
for (let i = 0; i < 15; i++) addCustomer("regular", { cadence: int(10, 21) });
for (let i = 0; i < 12; i++) addCustomer("lapsed", { highValue: i < 4 });
for (let i = 0; i < 10; i++) addCustomer("festival");
for (let i = 0; i < 10; i++) addCustomer("recent");
for (let i = 0; i < 8; i++) addCustomer("onetime");

const rows = [];
function addBill(c, date, categories, big = false, phoneStyleOverride) {
  const { cell, total } = basket(categories, big);
  const style = phoneStyleOverride ?? int(0, 4);
  rows.push([c.name, formatPhone(c.phone, style), c.email, fmtDate(date), cell, String(total), c.store]);
}

const SWEET_CATS = ["sweets", "namkeen", "bakery"];
for (const c of customers) {
  if (c.kind === "regular") {
    // steady cadence; last purchase slightly overdue for about half
    const overdue = rnd() < 0.5;
    const lastGap = overdue ? c.cadence + int(3, 8) : int(2, Math.max(3, c.cadence - 2));
    let t = TODAY.getTime() - lastGap * DAY;
    const nBills = int(4, 6);
    for (let i = 0; i < nBills; i++) {
      addBill(c, new Date(t), SWEET_CATS);
      t -= (c.cadence + int(-3, 3)) * DAY;
    }
  } else if (c.kind === "lapsed") {
    const recency = int(61, 89);
    let t = TODAY.getTime() - recency * DAY;
    const nBills = c.highValue ? int(5, 7) : int(2, 3);
    for (let i = 0; i < nBills; i++) {
      addBill(c, new Date(t), c.highValue ? ["sweets", "gift-boxes", "dry-fruits"] : SWEET_CATS, c.highValue);
      t -= int(20, 45) * DAY;
    }
  } else if (c.kind === "festival") {
    // Diwali 2025 (Oct 20) and/or Raksha Bandhan 2025 (Aug 9) baskets
    if (rnd() < 0.85) {
      const d = new Date("2025-10-" + int(15, 20) + "T18:30:00+05:30");
      addBill(c, d, ["gift-boxes", "sweets", "dry-fruits"], true);
    }
    if (rnd() < 0.6) {
      const d = new Date("2025-08-0" + int(3, 9) + "T17:00:00+05:30");
      addBill(c, d, ["gift-boxes", "sweets"], true);
    }
    // some ordinary purchases too
    const extra = int(1, 2);
    for (let i = 0; i < extra; i++) {
      addBill(c, new Date(TODAY.getTime() - int(20, 200) * DAY), SWEET_CATS);
    }
  } else if (c.kind === "recent") {
    const n = int(1, 3);
    for (let i = 0; i < n; i++) {
      addBill(c, new Date(TODAY.getTime() - int(2, 28) * DAY), SWEET_CATS);
    }
  } else {
    addBill(c, new Date(TODAY.getTime() - int(30, 300) * DAY), SWEET_CATS);
  }
}

// same customer, two phone formats across bills (dedup test): reuse customer 0
const dup = customers[0];
addBill(dup, new Date(TODAY.getTime() - 3 * DAY), SWEET_CATS, false, 2); // +91- format
addBill(dup, new Date(TODAY.getTime() - 40 * DAY), SWEET_CATS, false, 3); // leading 0

// two intentionally bad rows (exercise upload error logging)
rows.push(["Walk-in Customer", "12345", "", fmtDate(new Date(TODAY.getTime() - 5 * DAY)), "Jalebi|sweets|1|120", "120", "DDU-CP"]);
rows.push(["Bad Date Row", formatPhone(newPhone(), 0), "", "2026-13-45", "Samosa|namkeen|4|20", "80", "DDU-GK"]);

// sort by date desc like a real export
const parseD = (r) => {
  const [d, m, rest] = r[3].split("/");
  return rest ? new Date(`${rest.slice(0, 4)}-${m}-${d}T${r[3].slice(11) || "12:00"}`) : new Date(0);
};
rows.sort((a, b) => parseD(b) - parseD(a));

const esc = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const header = ["Customer Name", "Customer Mobile", "Customer Email", "Bill Date", "Items", "Bill Amount", "Store Code"];
const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n") + "\n";
fs.writeFileSync(process.argv[2], csv);
console.log(`rows: ${rows.length}, customers: ${customers.length}`);
