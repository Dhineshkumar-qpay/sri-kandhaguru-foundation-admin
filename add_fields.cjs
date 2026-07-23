const fs = require('fs');
const path = 'e:/Sri KandhaGuru Foundation/sri-kandhaguru-foundation-admin/src/pages/Events.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Interface Event
code = code.replace(
  /interface Event {[\s\S]*?status: string;\n}/,
  `interface Event {
  id: number;
  image: string;
  title: string;
  description?: string;
  category?: string;
  eventdate: string;
  starttime?: string;
  endtime?: string;
  address: string;
  participants: number;
  partcipants?: number;
  registrationfee?: number;
  venuename?: string;
  city: string;
  state: string;
  maplink?: string;
  eventtype: string;
  status: string;
  instructions?: string;
  deliverymode?: string;
  programtype?: string;
  duration?: string;
  benefits?: string[];
  eligibility?: string;
  dresscode?: string;
  thingstobring?: string[];
  registrationlastdate?: string;
  registrationactive?: boolean;
  agenda?: { starttime: string; endtime: string; title: string }[];
  ajanta?: { schedule: { starttime: string; endtime: string; title: string }[] };
}`
);

// 2. Add State for benefits and thingsToBring
code = code.replace(
  /const \[schedules, setSchedules\] = useState\(\[\n\s*\{ starttime: "", endtime: "", title: "" \},\n\s*\]\);/,
  `const [schedules, setSchedules] = useState([{ starttime: "", endtime: "", title: "" }]);\n  const [benefits, setBenefits] = useState<string[]>([""]);\n  const [thingsToBring, setThingsToBring] = useState<string[]>([""]);`
);
code = code.replace(
  /const \[schedules, setSchedules\] = useState\(\[\{ starttime: "", endtime: "", title: "" \}\]\);/,
  `const [schedules, setSchedules] = useState([{ starttime: "", endtime: "", title: "" }]);\n  const [benefits, setBenefits] = useState<string[]>([""]);\n  const [thingsToBring, setThingsToBring] = useState<string[]>([""]);`
);

// 3. Edit onClick
code = code.replace(
  /setEditingEvent\(event\);\n\s*setDeliveryMode\(event\.deliverymode \|\| "offline"\);\n\s*setShowForm\(true\);\n\s*if \(event\.ajanta\?\.schedule\?\.length\) \{\n\s*setSchedules\(event\.ajanta\.schedule\);\n\s*\} else \{\n\s*setSchedules\(\[\{ starttime: "", endtime: "", title: "" \}\]\);\n\s*\}/g,
  `setEditingEvent(event);
                              setDeliveryMode(event.deliverymode || "offline");
                              setShowForm(true);
                              setSchedules(event.agenda?.length ? event.agenda : (event.ajanta?.schedule?.length ? event.ajanta.schedule : [{ starttime: "", endtime: "", title: "" }]));
                              setBenefits(event.benefits?.length ? event.benefits : [""]);
                              setThingsToBring(event.thingstobring?.length ? event.thingstobring : [""]);`
);

// 4. Create onClick & Cancel onClicks (Generic match to reset benefits & thingsToBring)
code = code.replace(
  /setSchedules\(\[\{ starttime: "", endtime: "", title: "" \}\]\);/g,
  `setSchedules([{ starttime: "", endtime: "", title: "" }]);\n            setBenefits([""]);\n            setThingsToBring([""]);`
);

// 5. Payload updates
code = code.replace(
  /ajanta: \{\n\s*schedule: schedules,\n\s*\}/,
  `agenda: schedules,\n        programtype: formData.get("programtype"),\n        duration: formData.get("duration"),\n        benefits: benefits.filter((b) => b.trim() !== ""),\n        eligibility: formData.get("eligibility"),\n        dresscode: formData.get("dresscode"),\n        thingstobring: thingsToBring.filter((t) => t.trim() !== ""),\n        registrationlastdate: formData.get("registrationlastdate") || "",\n        registrationactive: formData.get("registrationactive") === "on"`
);
// fix participants typo
code = code.replace(
  /partcipants: Number\(formData\.get\("partcipants"\)\) \|\| 0,/,
  `participants: Number(formData.get("participants")) || Number(formData.get("partcipants")) || 0,`
);

// 6. JSX additions
// We need to inject Program Type, Duration right after Event Title/Category
const titleCategoryRegex = /(<input\s*name="category"[\s\S]*?\/>\s*<\/div>)/;
code = code.replace(titleCategoryRegex, `$1
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Type *
                </label>
                <select
                  name="programtype" defaultValue={editingEvent?.programtype || ""} required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 bg-white"
                >
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration *
                </label>
                <input
                  name="duration" defaultValue={editingEvent?.duration || ""} required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  placeholder="e.g. 1 Day"
                />
              </div>`
);

// 7. Inject Eligibility, Dress Code, Registration Active, Reg Last Date before Description
const descriptionRegex = /(<div className="xl:col-span-3">\s*<label className="block text-sm font-medium text-gray-700 mb-1">\s*Description \*)/;
code = code.replace(descriptionRegex, `
              <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eligibility
                  </label>
                  <input
                    name="eligibility" defaultValue={editingEvent?.eligibility || ""}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                    placeholder="e.g. Open to participants aged 12 years and above"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dress Code
                  </label>
                  <input
                    name="dresscode" defaultValue={editingEvent?.dresscode || ""}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                    placeholder="e.g. Traditional attire"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Active
                </label>
                <div className="flex items-center h-[42px]">
                  <input
                    name="registrationactive" defaultChecked={editingEvent ? editingEvent.registrationactive : true}
                    type="checkbox"
                    className="w-5 h-5 text-saffron-600 border-gray-300 rounded focus:ring-saffron-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Is active</span>
                </div>
              </div>
              {deliveryMode === "offline" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Last Date
                  </label>
                  <input
                    name="registrationlastdate" defaultValue={editingEvent?.registrationlastdate ? editingEvent.registrationlastdate.split('T')[0] : ""}
                    type="date"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                  />
                </div>
              )}
$1`
);

// 8. Inject Benefits and Things To Bring arrays after Agenda
const agendaRegexStr = /(Ajanta \(Schedule\)[\s\S]*?<\/button>\s*\)\}\s*<\/div>\s*\)\)\}\s*<\/div>\s*<\/div>\s*<\/>\)\})/;
code = code.replace(agendaRegexStr, (match) => {
  return match.replace("Ajanta (Schedule)", "Agenda") + `
              <div className="xl:col-span-3 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Benefits</label>
                  <button type="button" onClick={() => setBenefits([...benefits, ""])} className="text-sm text-saffron-600 hover:text-saffron-700 font-medium flex items-center gap-1 cursor-pointer">
                    <Plus className="w-4 h-4" /> Add Benefit
                  </button>
                </div>
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-3">
                      <input type="text" value={benefit} onChange={(e) => { const newB = [...benefits]; newB[index] = e.target.value; setBenefits(newB); }} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500/50" placeholder="Benefit description" />
                      {benefits.length > 1 && (<button type="button" onClick={() => setBenefits(benefits.filter((_, i) => i !== index))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0 cursor-pointer"><Trash2 className="w-4 h-4" /></button>)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="xl:col-span-3 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Things To Bring</label>
                  <button type="button" onClick={() => setThingsToBring([...thingsToBring, ""])} className="text-sm text-saffron-600 hover:text-saffron-700 font-medium flex items-center gap-1 cursor-pointer">
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {thingsToBring.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <input type="text" value={item} onChange={(e) => { const newT = [...thingsToBring]; newT[index] = e.target.value; setThingsToBring(newT); }} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500/50" placeholder="e.g. Yoga Mat" />
                      {thingsToBring.length > 1 && (<button type="button" onClick={() => setThingsToBring(thingsToBring.filter((_, i) => i !== index))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0 cursor-pointer"><Trash2 className="w-4 h-4" /></button>)}
                    </div>
                  ))}
                </div>
              </div>`;
});

// Change partcipants to participants in the form field name
code = code.replace(/name="partcipants"/g, 'name="participants"');
code = code.replace(/defaultValue=\{editingEvent\?\.partcipants \|\| ""\}/g, 'defaultValue={editingEvent?.participants || editingEvent?.partcipants || ""}');

fs.writeFileSync(path, code);
console.log("Done");
