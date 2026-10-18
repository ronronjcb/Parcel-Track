// Mga field ng Create Parcel. Ang "max" ay galing sa laki ng column sa database.
export const PARCEL_FIELDS = [
  {
    name: "transaction_number",
    label: "Transaction number",
    max: 100,
    placeholder: "e.g. TXN-2026-0001",
    help: "Scan the QR above, or type it. Each transaction number can only be registered once.",
  },
  { name: "receiver_name", label: "Receiver name", max: 100, placeholder: "e.g. Juan Dela Cruz" },
  {
    name: "receiver_contact",
    label: "Receiver contact number",
    max: 50,
    placeholder: "e.g. 09123456789",
    type: "tel",
  },
  { name: "contents", label: "Parcel contents", max: 255, placeholder: "e.g. Shoes" },
];

export const EMPTY_PARCEL = {
  transaction_number: "",
  receiver_name: "",
  receiver_contact: "",
  contents: "",
};

// Ibinabalik ang { fieldName: "error message" }. Walang laman = walang error.
export function validateParcel(values) {
  const errors = {};
  for (const f of PARCEL_FIELDS) {
    const v = (values[f.name] || "").trim();
    if (!v) errors[f.name] = `${f.label} is required.`;
    else if (v.length > f.max) errors[f.name] = `${f.label} must be ${f.max} characters or fewer.`;
  }
  const contact = (values.receiver_contact || "").trim();
  if (!errors.receiver_contact && !/^[0-9+()\-\s]{7,}$/.test(contact)) {
    errors.receiver_contact = "Enter a valid contact number (digits, spaces and + - ( ) only).";
  }
  return errors;
}

export function trimParcel(values) {
  return Object.fromEntries(PARCEL_FIELDS.map((f) => [f.name, (values[f.name] || "").trim()]));
}
