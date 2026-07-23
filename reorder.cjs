const fs = require('fs');
const path = 'e:/Sri KandhaGuru Foundation/sri-kandhaguru-foundation-admin/src/pages/Events.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add state
code = code.replace(
  'const [editingEvent, setEditingEvent] = useState<Event | null>(null);',
  'const [editingEvent, setEditingEvent] = useState<Event | null>(null);\n  const [deliveryMode, setDeliveryMode] = useState("offline");'
);

// 2. Open form button
code = code.replace(
  /onClick=\{\(\) => \{\n\s*setEditingEvent\(null\);\n\s*setSchedules\(\[\{ starttime: "", endtime: "", title: "" \}\]\);\n\s*setShowForm\(true\);\n\s*\}\}/,
  `onClick={() => {
            setEditingEvent(null);
            setDeliveryMode("offline");
            setSchedules([{ starttime: "", endtime: "", title: "" }]);
            setShowForm(true);
          }}`
);

// 3. Edit form button (lines 730-738)
code = code.replace(
  /onClick=\{\(\) => \{\n\s*setEditingEvent\(event\);\n\s*setShowForm\(true\);\n\s*if \(event\.ajanta\?\.schedule\?\.length\) \{/g,
  `onClick={() => {
                              setEditingEvent(event);
                              setDeliveryMode(event.deliverymode || "offline");
                              setShowForm(true);
                              if (event.ajanta?.schedule?.length) {`
);

// 4. Cancel button top
code = code.replace(
  /onClick=\{\(\) => \{\n\s*setShowForm\(false\);\n\s*setEditingEvent\(null\);\n\s*setSchedules\(\[\{ starttime: "", endtime: "", title: "" \}\]\);\n\s*\}\}/g,
  `onClick={() => {
                setShowForm(false);
                setEditingEvent(null);
                setDeliveryMode("offline");
                setSchedules([{ starttime: "", endtime: "", title: "" }]);
              }}`
);

// 5. Remove old Delivery Mode
const deliveryModeRegex = /\s*<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">\s*Delivery Mode \*\s*<\/label>\s*<select\s*name="deliverymode" defaultValue=\{editingEvent\?\.deliverymode \|\| ""\} required\s*className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500\/50 bg-white"\s*>\s*<option value="offline">Offline<\/option>\s*<option value="online">Online<\/option>\s*<\/select>\s*<\/div>/;
code = code.replace(deliveryModeRegex, '');

// 6. Insert new Delivery Mode
const gridStartRegex = /<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">/;
code = code.replace(gridStartRegex, `<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Mode *
                </label>
                <select
                  name="deliverymode"
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500/50 bg-white"
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>`);

// 7. Conditionally render Date to Participants
// The regex finds from the Date div to the Participants div
// We need to carefully select it
const dateToPartRegex = /(<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">\s*Date \*[\s\S]*?name="partcipants"[\s\S]*?placeholder="e\.g\. 1500"\s*\/>\s*<\/div>)/;
code = code.replace(dateToPartRegex, `{deliveryMode === "offline" && (<>\n$1\n</>)}`);

// 8. Conditionally render Venue to MapLink
const venueToMapRegex = /(<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">\s*Venue Name \*[\s\S]*?name="maplink"[\s\S]*?placeholder="https:\/\/maps\.google\.com\/\.\.\."\s*\/>\s*<\/div>)/;
code = code.replace(venueToMapRegex, `{deliveryMode === "offline" && (<>\n$1\n</>)}`);

// 9. Conditionally render Schedule
const scheduleRegex = /(<div className="xl:col-span-3 mt-4">\s*<div className="flex justify-between items-center mb-2">\s*<label className="block text-sm font-medium text-gray-700">\s*Ajanta \(Schedule\)[\s\S]*?Trash2 className="w-4 h-4" \/>\s*<\/button>\s*\)\}\s*<\/div>\s*\)\)\}\s*<\/div>\s*<\/div>)/;
code = code.replace(scheduleRegex, `{deliveryMode === "offline" && (<>\n$1\n</>)}`);

fs.writeFileSync(path, code);
console.log("Done");
