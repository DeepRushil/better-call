/**
 * @fileoverview Official legal registry and directory mappings for Better Call.
 * Contains verified Bar Council portal mappings for all 36 States and Union Territories,
 * along with institutional legal aid URLs (NALSA, Nyaya Bandhu).
 */

const NALSA_URL = "https://nalsa.gov.in/";
const NYAYA_BANDHU_URL = "https://doj.gov.in/nyaya-bandhu-pb/";
const BCI_URL = "https://www.barcouncilofindia.org/";

/**
 * Verified State Bar Council portals across all 28 Indian States and 8 Union Territories.
 * @type {Object.<string, {name: string, url: string, note: string}>}
 */
const barCouncilLinks = {
  "Delhi (NCT)":    { name: "Bar Council of Delhi",                     url: "https://delhibarcouncil.com/",        note: "Search by advocate name or enrollment number" },
  "Maharashtra":    { name: "Bar Council of Maharashtra & Goa",         url: "https://barcouncilmahgoa.org/",       note: "Click Member Search on the portal" },
  "Goa":            { name: "Bar Council of Maharashtra & Goa",         url: "https://barcouncilmahgoa.org/",       note: "Click Member Search on the portal" },
  "Karnataka":      { name: "Karnataka State Bar Council",              url: "https://ksbc.org.in/",                note: "Use the Advocate Search section" },
  "Tamil Nadu":     { name: "Bar Council of Tamil Nadu & Puducherry",   url: "https://www.bctnpy.org/",             note: "Search advocates by name or number" },
  "Puducherry":     { name: "Bar Council of Tamil Nadu & Puducherry",   url: "https://www.bctnpy.org/",             note: "Search advocates by name or number" },
  "Gujarat":        { name: "Bar Council of Gujarat",                   url: "https://barcouncilofgujarat.org/",   note: "Check Advocate/Welfare Data section" },
  "Uttar Pradesh":  { name: "Bar Council of Uttar Pradesh",             url: "http://upbarcouncil.com/",            note: "Use Advocate Search on the site" },
  "Rajasthan":      { name: "Bar Council of Rajasthan",                 url: "https://barcouncilofrajasthan.org/", note: "Search enrolled advocates" },
  "Kerala":         { name: "Bar Council of Kerala",                    url: "https://barcouncilkerala.org/",      note: "Check the Lawyer Registry section" },
  "Andhra Pradesh": { name: "Bar Council of Andhra Pradesh",            url: "https://barcouncilap.org/",           note: "Go to Enrolments > Search By Name" },
  "Telangana":      { name: "Bar Council of Telangana",                 url: "https://www.telanganabarcouncil.org/",note: "Check COP Details or directory section" },
  "West Bengal":    { name: "Bar Council of West Bengal",               url: "https://wbbarcouncil.org/",           note: "Check member/enrolment information" },
  "Bihar":          { name: "Bihar State Bar Council",                  url: "https://biharstatebarcouncil.com/",  note: "Access advocate search via the portal" },
  "Punjab":         { name: "Bar Council of Punjab & Haryana",          url: "https://bcph.co.in/",                note: "Use Online Services/Member section" },
  "Haryana":        { name: "Bar Council of Punjab & Haryana",          url: "https://bcph.co.in/",                note: "Use Online Services/Member section" },
  "Chandigarh":     { name: "Bar Council of Punjab & Haryana",          url: "https://bcph.co.in/",                note: "Use Online Services/Member section" },
  "Madhya Pradesh": { name: "State Bar Council of Madhya Pradesh",      url: "https://www.sbcofmp.org.in/",         note: "Check Enrolled Advocates List" },
  "Himachal Pradesh":{ name: "Bar Council of Himachal Pradesh",         url: "https://bchp.gov.in/",               note: "Search by advocate name" },
  "Jharkhand":      { name: "Jharkhand State Bar Council",              url: "https://jharkhandbarcouncil.org/",   note: "Check the member directory" },
  "Odisha":         { name: "Bar Council of Odisha",                    url: "https://www.barcouncilofindia.org/",  note: "Contact state council or visit BCI portal" },
  "Assam":          { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact Bar Council of Assam for details" },
  "Chhattisgarh":   { name: "Chhattisgarh State Bar Council",           url: "https://www.barcouncilofindia.org/",  note: "Contact state council for advocate details" },
  "Uttarakhand":    { name: "Uttarakhand Bar Council",                  url: "https://www.barcouncilofindia.org/",  note: "Contact state council for advocate details" },
  "Sikkim":         { name: "Bar Council of Sikkim",                    url: "https://www.barcouncilofindia.org/",  note: "Contact state council for advocate details" },
  "Jammu and Kashmir": { name: "J&K Bar Association",                   url: "https://www.barcouncilofindia.org/",  note: "Contact local bar association" },
  "Ladakh":         { name: "Bar Council of India",                     url: "https://www.barcouncilofindia.org/",  note: "Newly created UT, contact BCI" },
  "Andaman and Nicobar Islands": { name: "Bar Council of India",        url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for advocate details" },
  "Lakshadweep":    { name: "Bar Council of India",                     url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for advocate details" },
  "Dadra and Nagar Haveli and Daman and Diu": { name: "Bar Council of India", url: "https://www.barcouncilofindia.org/", note: "Contact BCI for advocate details" },
  "Arunachal Pradesh": { name: "Bar Council of Assam & NE States",      url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" },
  "Manipur":        { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" },
  "Meghalaya":      { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" },
  "Mizoram":        { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" },
  "Nagaland":       { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" },
  "Tripura":        { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" }
};

const supportedLanguages = [
  "English", "Hindi", "Tamil", "Telugu", "Bengali",
  "Marathi", "Gujarati", "Kannada", "Malayalam"
];

const templateTypes = [
  "RTI Application",
  "Consumer Complaint",
  "Legal Notice for Unpaid Salary",
  "Legal Notice for Security Deposit Refund",
  "FIR Draft / Police Complaint",
  "Bail Application",
  "Employment Agreement Review Checklist",
  "Rental Agreement Review Checklist",
  "Will / Testament Draft",
  "Affidavit Draft"
];

module.exports = {
  NALSA_URL,
  NYAYA_BANDHU_URL,
  BCI_URL,
  barCouncilLinks,
  supportedLanguages,
  templateTypes
};
