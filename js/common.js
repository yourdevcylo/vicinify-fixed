// =========================================
// 🌙 THEME MANAGER (DARK MODE SAVER)
// =========================================
window.ThemeManager = (() => {
    function applyTheme(theme) {
        const resolvedTheme = theme === 'system'
            ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;

        if (theme === 'dark') {
            document.body.classList.add('dark-mode'); document.body.classList.add('dark');
        } else if (theme === 'light') {
            document.body.classList.remove('dark-mode'); document.body.classList.remove('dark');
        } else { // system
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.body.classList.add('dark-mode'); document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark-mode'); document.body.classList.remove('dark');
            }
        }

        document.documentElement.dataset.theme = resolvedTheme;
        document.body.dataset.theme = resolvedTheme;
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolvedTheme === "dark" ? "#14231f" : "#237e72");
        window.dispatchEvent(new CustomEvent("vicinify:themechange", { detail: { theme, resolvedTheme } }));
    }

    function init() {
        const savedTheme = localStorage.getItem('vicinify_theme') || 'system';
        applyTheme(savedTheme);

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if ((localStorage.getItem('vicinify_theme') || 'system') === 'system') applyTheme('system');
        });
    }

    function setTheme(theme) {
        localStorage.setItem('vicinify_theme', theme);
        applyTheme(theme);
    }

    function getTheme() {
        return localStorage.getItem('vicinify_theme') || 'system';
    }

    return { init, setTheme, getTheme, applyTheme };
})();

window.ThemeManager.init();

// =========================================
// 🌍 GLOBAL TRANSLATION ENGINE (i18n) - BULLETPROOF
// =========================================
window.LangManager = (() => {
    // Explicit application UI translations; never translate stored user content.
    const phDictionary = {
  "Reserve your seats": "Magpareserba ng puwesto",
  "Reserve food or items": "Magpareserba ng pagkain o paninda",
  "Order now, pick up later": "Bumili ngayon at kunin mamaya",
  "Delivered to your door": "Ihahatid sa iyong tirahan",
  "Bulk, cakes, events": "Maramihang bilin, keyk, o pagdiriwang",
  "Items / Order": "Mga pagkain o bilin",
  "Seating": "Puwesto",
  "Request sent. Opening your transaction chat...": "Naipadala na ang kahilingan. Binubuksan ang usapan ng iyong transaksiyon...",
  "Review request": "Suriin ang kahilingan",
  "Review your request": "Suriin ang iyong kahilingan",
  "1 of 2 · Request details": "1 sa 2 · Detalye ng kahilingan",
  "2 of 2 · Review and send": "2 sa 2 · Suriin at ipadala",
  "Back to edit": "Bumalik at baguhin",
  "Not sent yet": "Hindi pa naipadala",
  "What happens next": "Ano ang susunod",
  "The business will accept or decline your request. Follow updates in your transaction chat.": "Tatanggapin o tatanggihan ng negosyo ang iyong kahilingan. Subaybayan ang mga pagbabago sa usapan ng transaksiyon.",
  "Send payment details only after the business accepts.": "Ipadala lamang ang detalye ng bayad matapos tanggapin ng negosyo.",
  "Free cancellation before preparation if no payment is recorded. Paid cancellations use the saved refund rate. Refund transfers are manual and must be confirmed separately.": "Walang bayad ang pagkansela bago maghanda kung wala pang naitalang bayad. Ang kinanselang may bayad ay susunod sa nakatalang bahagdan ng ibabalik. Kailangang ipadala at kumpirmahin nang hiwalay ang ibinalik na halaga.",
  "Refund rate on paid cancellations": "Bahagdan ng ibabalik sa kinanselang may bayad",
  "Welcome to Vicinify": "Maligayang pagdating sa Vicinify",
  "Sign in to continue": "Pumasok para magpatuloy",
  "Create your account": "Gumawa ng akawnt",
  "Full Name": "Buong Pangalan",
  "Email": "Adres ng sulatroniko",
  "Password": "Kontrasenyas",
  "Sign in": "Pumasok",
  "Sign up": "Magparehistro",
  "Map": "Mapa",
  "Add": "Magdagdag",
  "Buzz": "Balita",
  "Dashboard": "Pamahalaan",
  "Business Hub": "Sentro ng Negosyo",
  "Settings": "Mga Pagpipilian",
  "Radius:": "Layo:",
  "All": "Lahat",
  "Add Establishment": "Magdagdag ng Establisyimento",
  "Pin location, fill details, then submit for approval.": "I-pananda ang lokasyon at punan ang detalye.",
  "Nearby Buzz": "Balita sa Paligid",
  "News in your area": "Balita sa lugar mo",
  "Manage your establishments": "Pamahalaan ang iyong mga tindahan",
  "Profile & Settings": "Pagkakakilanlan at mga Pagpipilian",
  "Manage your account and preferences": "Ayusin ang iyong akawnt at aplikasyon",
  "User Profile": "Impormasyon ng Gumagamit",
  "Appearance & Language": "Hitsura at Wika",
  "Theme Preference": "Tema ng Aplikasyon",
  "System Default": "Batay sa aparato",
  "Light Mode": "Maliwanag na tema",
  "Dark Mode": "Madilim na tema",
  "Language": "Wika",
  "My Activities": "Aking Aktibidad",
  "My Bookings": "Mga Kahilingan Ko",
  "My Requests": "Mga Kahilingan Ko",
  "My Chats": "Mga Usapan Ko",
  "Favorites": "Mga Paborito",
  "Log Out": "Lumabas",
  "Delete My Account": "Burahin ang aking akawnt",
  "Send Request": "Ipadala ang kahilingan",
  "Customer Requests": "Mga Kahilingan ng Mamimili",
  "Ask Vicinify": "Magtanong sa Vicinify",
  "Transactions": "Mga Transaksyon",
  "Chat History": "Kasaysayan ng usapan",
  "Save Profile": "Ilagak ang pagkakakilanlan",
  "Post": "Magpaskil",
  "View Map": "Tingnan ang Mapa",
  "System": "Batay sa aparato",
  "Light": "Maliwanag",
  "Dark": "Madilim",
  "English": "Ingles",
  "Tagalog": "Tagalog",
  "Post Now": "Magpaskil Ngayon",
  "Reviews": "Mga pagsusuri",
  "Feedback Insights": "Pagsusuri ng puna",
  "New Listing": "Bagong tala",
  "My Establishments": "Aking mga Establisyimento",
  "Customer Inbox": "Kahon ng mensahe ng mga Mamimili",
  "Database Management": "Pamamahala ng Imbakan ng datos",
  "Forgot password?": "Nakalimutan ang kontrasenyas?",
  "Password & Security": "Kontrasenyas at Seguridad",
  "Signed in as": "Nakapasok bilang",
  "Send Password Reset Email": "Magpadala ng Sulatroniko para Ibalik ang Kontrasenyas",
  "We will email you a secure link so you can create a new password.": "Padadalhan ka namin ng ligtas ugnay para gumawa ng bagong kontrasenyas.",
  "Change password now": "Palitan ang kontrasenyas ngayon",
  "Current Password": "Kasalukuyang kontrasenyas",
  "New Password": "Bagong kontrasenyas",
  "Confirm New Password": "Ulitin ang bagong kontrasenyas",
  "Update Password": "Palitan ang kontrasenyas",
  "Reset your password": "Ibalik ang iyong kontrasenyas",
  "Cancel": "Kanselahin",
  "Send reset link": "Ipadala ang reset ugnay",
  "Basic Info": "Pangunahing impormasyon",
  "Operating Hours": "Oras ng Operasyon",
  "Create Post": "Gumawa ng paskil",
  "Send a Message": "Magpadala ng Mensahe",
  "Edit Establishment": "Baguhin ang Tindahan",
  "Account History": "Kasaysayan ng Akawnt",
  "Appearance": "Hitsura",
  "Restaurant": "Restawran",
  "Café": "Kapihan",
  "Bakery": "Panaderya",
  "Milk Tea": "Tsaa na may gatas",
  "Snack House": "Meryendahan",
  "Food Stall": "Puwesto ng pagkain",
  "Eatery": "Karinderya",
  "Dessert Shop": "Panghimagas",
  "Fast-Food": "Mabilisang kainan",
  "Filters": "Mga sala",
  "Open": "Bukas",
  "Closed": "Sarado",
  "Busy": "Abala",
  "Fresh": "Bagong impormasyon",
  "Inactive": "Hindi Aktibo",
  "Nearby": "Malapit",
  "No ratings yet": "Wala pang marka",
  "Chat": "Usapan",
  "Request": "Kahilingan",
  "Navigate": "Mag-navigate",
  "Message": "Mensahe",
  "View": "Tingnan",
  "Comment": "Komento",
  "No comments yet. Start the conversation.": "Wala pang komento. Simulan ang usapan.",
  "Write a comment...": "Sumulat ng komento...",
  "Loading conversation...": "Inihahanda ng usapan...",
  "No messages yet. Send an inquiry!": "Wala pang mensahe. Magtanong na!",
  "No establishments found. Try adjusting the search radius or category.": "Walang nakitang tindahan. Baguhin ang layo o kategorya.",
  "About this place": "Tungkol dito",
  "Menu & Store Posts": "Pagkain at mga paskil ng tindahan",
  "Rate this establishment": "Markahan ang tindahang ito",
  "Verified Reviews": "Mga Napatunayan Pagsusuri",
  "No menu posts yet": "Wala pang talaan ng pagkain paskil",
  "away": "ang layo",
  "Send": "Ipadala",
  "Search places...": "Maghanap ng lugar...",
  "Load more": "Mag-paghahanda pa",
  "Claims": "Mga Pag-angkin",
  "Reports": "Mga ulat",
  "Audit": "Talaan ng mga aksyon",
  "Sounds": "Mga Tunog",
  "Navigation sounds": "Tunog sa paglipat",
  "Subtle clicks when navigating": "Mahinang tunog habang lumilipat ng pahina",
  "Manage your account and preferences.": "Pamahalaan ang iyong akawnt at mga kagustuhan.",
  "Nickname (Display Name)": "Palayaw (Pangalang ipinapakita)",
  "Date *": "Petsa *",
  "Time *": "Oras *",
  "Send a request": "Magpadala ng kahilingan",
  "Choose your booking": "Piliin ang pagpapareserba",
  "Table Reservation": "Reserbasyon ng Mesa",
  "Food Reservation": "Reserbasyon ng Pagkain",
  "Number of Guests *": "Bilang ng Bisita *",
  "Additional Notes": "Karagdagang Pahayag",
  "Payment Method": "Paraan ng Pagbabayad",
  "Payment Method *": "Paraan ng pagbabayad *",
  "Needs your reply": "Kailangang sagutin",
  "Conversations": "Mga Pag-uusap",
  "Add post / photo": "Magdagdag ng paskil / larawan",
  "Store Suki QR": "Suki QR ng Tindahan",
  "My Activity": "Aking Gawain",
  "Back": "Bumalik",
  "Save": "Ilagak",
  "Save changes": "Ilagak ang pagbabago",
  "View page": "Tingnan ang pahina",
  "Manage Listing": "Ayusin ang Impormasyon",
  "Messages": "Mga Mensahe",
  "Suki Cards": "Mga Kard ng Suki",
  "Open conversation": "Buksan ang pag-uusap",
  "Hide record": "Itago ang rekord",
  "Request details": "Detalye ng kahilingan",
  "No posts yet": "Wala pang mga paskil",
  "More filters": "Iba pang sala",
  "Show less": "Ipakita ang mas kaunti",
  "Open now": "Bukas ngayon",
  "Verified": "Beripikado",
  "Bookable": "Tumatanggap ng pagpapareserba",
  "Delivery": "Paghahatid",
  "Fresh info": "Bagong impormasyon",
  "View menu": "Tingnan ang talaan ng pagkain",
  "Opening hours": "Oras ng pagbubukas",
  "Delivery options": "Mga paraan ng paghahatid",
  "Book a table": "Magpareserba ng mesa",
  "Quick questions": "Mga madalas itanong",
  "Hide": "Itago",
  "Automatic reply": "Awtomatikong sagot",
  "Booking": "Reserbasyon",
  "Order": "Bilin",
  "Reserve a table or food": "Magpareserba ng mesa o pagkain",
  "Pickup, delivery, or advance": "Pagkuha, paghahatid, o paunang bilin",
  "Reserve seats or table": "Magpareserba ng upuan o mesa",
  "Reserve food/item": "Magpareserba ng pagkain",
  "Seating Preference": "Gustong Upuan",
  "No preference": "Kahit saan",
  "Window": "Malapit sa bintana",
  "Quiet": "Tahimik",
  "Outdoor": "Sa labas",
  "Occasion": "Okasyon",
  "None": "Wala",
  "Food Items to Reserve *": "Mga pagkaing ipapareserba *",
  "Order Details *": "Detalye ng bilin *",
  "Fulfillment": "Paraan ng pagtanggap",
  "Dine-in": "Kakain sa tindahan",
  "Send Table Reservation": "Ipadala ang Reserbasyon",
  "Send Food Reservation": "Ipadala ang Pagkain Reservation",
  "Send Pickup Pre-order": "Ipadala ang Pagkuha Bilin",
  "Send Delivery Order": "Ipadala ang Paghahatid Bilin",
  "Submit for Approval": "Ipadala para sa Pag-apruba",
  "Scan store QR": "I-pagbasa ng kodigo ang QR ng tindahan",
  "Stamp request pending": "Naghihintay ng tatak approval",
  "Cancel request": "Kanselahin ang kahilingan",
  "Edit caption / photo": "Baguhin ang paliwanag sa larawan / larawan",
  "Delete": "Burahin",
  "Share to Buzz": "Ibahagi sa Balita",
  "Search distance": "Layo ng paghahanap",
  "Write a message...": "Sumulat ng mensahe...",
  "Search places or ask Vici…": "Maghanap ng lugar o magtanong kay Vicinify…",
  "Establishments": "Mga establisyimento",
  "Total Establishments": "Kabuuang establisyimento",
  "Pending Approvals": "Mga naghihintay ng pag-apruba",
  "Pending Approval": "Naghihintay ng pag-apruba",
  "Registered Owners": "Mga rehistradong may-ari",
  "Open Now": "Bukas ngayon",
  "Unread Updates": "Mga hindi pa nababasang pagbabago",
  "Unread update": "Hindi pa nababasang pagbabago",
  "Admin Panel": "Lupon ng Tagapangasiwa",
  "Administrator tools": "Mga kagamitan ng tagapangasiwa",
  "Review establishments, users, posts, transactions, messages, claims, and reports.": "Suriin ang mga establisyimento, gumagamit, paskil, transaksyon, mensahe, pag-angkin, at ulat.",
  "Owner Email": "Sulatroniko ng may-ari",
  "Approval Status": "Katayuan ng pag-apruba",
  "Approval status": "Katayuan ng pag-apruba",
  "Category": "Kategorya",
  "Category *": "Kategorya *",
  "Name": "Pangalan",
  "Users": "Mga gumagamit",
  "Admin": "Tagapangasiwa",
  "Business": "Negosyo",
  "Standard": "Karaniwang gumagamit",
  "Customer": "Mamimili",
  "Role": "Tungkulin",
  "Actions": "Mga aksyon",
  "Action": "Aksyon",
  "Author": "May-akda",
  "Sender": "Nagpadala",
  "Place": "Lugar",
  "Status": "Katayuan",
  "Pending": "Naghihintay",
  "Approved": "Naaprubahan",
  "Rejected": "Tinanggihan",
  "Accepted": "Tinanggap",
  "Preparing": "Inihahanda",
  "Ready": "Handa na",
  "Fulfilled": "Natupad",
  "Received": "Natanggap",
  "Cancelled": "Kinansela",
  "Delivered": "Naihatid",
  "Out for delivery": "Papasok na sa paghahatid",
  "Payment submitted": "Naisumite ang bayad",
  "Payment confirmed": "Nakumpirma ang bayad",
  "Unclaimed": "Wala pang may-ari",
  "Approve": "Aprubahan",
  "Reject": "Tanggihan",
  "Assign Owner": "Magtalaga ng may-ari",
  "Assign": "Italaga",
  "Resolve": "Lutasin",
  "Clear": "I-clear",
  "Clear filter": "Alisin ang sala",
  "Clear all": "Alisin lahat",
  "Clear recent chats": "Burahin ang mga nakaraang usapan",
  "No establishments yet": "Wala pang establisyimento",
  "No transaction history yet.": "Wala pang kasaysayan ng transaksyon.",
  "Transaction history is kept for records. Business or admin dashboard cleanup will not remove it here.": "Iniingatan ang kasaysayan ng transaksyon. Hindi ito mawawala rito kapag naglinis ng pamahalaan ang negosyo o tagapangasiwa.",
  "Chat history is separate from official transactions.": "Hiwalay ang kasaysayan ng usapan sa mga opisyal na transaksyon.",
  "No saved favorite establishments yet.": "Wala pang nakalagak na paboritong establisyimento.",
  "No Suki Card requests yet.": "Wala pang kahilingan para sa Suki Kard.",
  "No pending stamp requests.": "Walang naghihintay na tatak kahilingan.",
  "No admin actions logged yet.": "Wala pang naitalang aksyon ng tagapangasiwa.",
  "No business claims yet.": "Wala pang pag-angkin sa negosyo.",
  "No claims waiting.": "Walang naghihintay na pag-angkin.",
  "No reports yet.": "Wala pang ulat.",
  "No requests yet.": "Wala pang kahilingan.",
  "No requests yet, or they have been deleted.": "Wala pang kahilingan o nabura na ang mga ito.",
  "No messages yet.": "Wala pang mensahe.",
  "No messages yet, or they have been deleted.": "Wala pang mensahe o nabura na ang mga ito.",
  "No additional details.": "Walang karagdagang detalye.",
  "Loading...": "Inihahanda...",
  "Loading dashboard...": "Inihahanda ang pamahalaan...",
  "Loading your establishments...": "Inihahanda ang iyong mga establisyimento...",
  "Loading transactions...": "Inihahanda ang mga transaksyon...",
  "Loading chats...": "Inihahanda ang mga usapan...",
  "Loading favorites...": "Inihahanda ang mga paborito...",
  "Loading posts...": "Inihahanda ang mga paskil...",
  "Loading Suki Cards...": "Inihahanda ang mga Suki Kard...",
  "Loading Suki Card…": "Inihahanda ang Suki Kard…",
  "Loading QR…": "Inihahanda ang QR…",
  "Loading verified reviews...": "Inihahanda ang mga napatunayang pagsusuri...",
  "Fetching users...": "Kinukuha ang mga gumagamit...",
  "Fetching users from database...": "Kinukuha ang mga gumagamit mula sa imbakan ng datos...",
  "Fetching buzz posts...": "Kinukuha ang mga Balita paskil...",
  "Fetching live posts...": "Kinukuha ang mga kasalukuyang paskil...",
  "Fetching transactions...": "Kinukuha ang mga transaksyon...",
  "Fetching messages...": "Kinukuha ang mga mensahe...",
  "Fetching claims...": "Kinukuha ang mga pag-angkin...",
  "Fetching reports...": "Kinukuha ang mga ulat...",
  "Fetching audit log...": "Kinukuha ang talaan ng mga aksyon...",
  "Issue": "Isyu",
  "Issue type": "Uri ng isyu",
  "Content": "Nilalaman",
  "Target": "Pinatutungkulan",
  "When": "Kailan",
  "User": "Gumagamit",
  "New": "Bago",
  "NEW": "BAGO",
  "Current": "Kasalukuyan",
  "Default": "Paunang pili",
  "Other": "Iba pa",
  "Details": "Mga detalye",
  "Address": "Tirahan",
  "Contact": "Kontak",
  "Contact Phone": "Numero ng telepono",
  "Contact Email": "Sulatroniko para sa pakikipag-ugnayan",
  "Contact Number (optional)": "Numero ng kontak (opsyonal)",
  "Description": "Paglalarawan",
  "Description (optional)": "Paglalarawan (opsyonal)",
  "Budget": "Badyet",
  "Budget per person (optional)": "Badyet bawat tao (opsyonal)",
  "Establishment": "Establisyimento",
  "Establishment Name": "Pangalan ng establisyimento",
  "Establishment name": "Pangalan ng establisyimento",
  "Establishment information": "Impormasyon ng establisyimento",
  "Establishment Posts": "Mga paskil ng establisyimento",
  "Business Name *": "Pangalan ng negosyo *",
  "Business name": "Pangalan ng negosyo",
  "Business owner email": "Sulatroniko ng may-ari ng negosyo",
  "Business workspace": "Lugar-gawaan ng negosyo",
  "Live customer activity": "Kasalukuyang aktibidad ng mamimili",
  "Live Store Status": "Kasalukuyang katayuan ng tindahan",
  "Update status, edit details, and monitor activity.": "Baguhin ang katayuan, baguhin ang mga detalye, at subaybayan ang aktibidad.",
  "Unread badges clear when checked, history remains protected.": "Nawawala ang hindi nabasa pananda kapag nabasa na; nananatiling ligtas ang kasaysayan.",
  "Your orders, chats, Suki cards, and saved places.": "Ang iyong mga bilin, usapan, kard ng suki, at nakalagak na lugar.",
  "Manage your daily operations, listings, and customer messages.": "Pamahalaan ang operasyon, mga listing, at mensahe ng mga mamimili.",
  "Requests & Cancellation": "Mga kahilingan at pagkansela",
  "Accepting Requests": "Tumatanggap ng mga kahilingan",
  "Allow customers to book": "Payagang mag-book ang mga mamimili",
  "Cancellation Refund (before preparation starts)": "Ibabalik na bayad sa pagkansela (bago simulan ang paghahanda)",
  "50% refund — you keep 50% as compensation": "50% ibabalik na bayad — sa iyo ang 50% bilang kabayaran",
  "70% refund — you keep 30% as compensation": "70% ibabalik na bayad — sa iyo ang 30% bilang kabayaran",
  "If a customer cancels after you accept but before you tap Start Preparing, they get this much back. Once preparation starts, cancellation is closed (no refund).": "Kung magkansela ang mamimili matapos mong tanggapin ngunit bago simulan ang paghahanda, ito ang halagang ibabalik. Kapag nagsimula na ang paghahanda, bawal nang magkansela at walang ibabalik na bayad.",
  "Automatic replies": "Mga awtomatikong sagot",
  "Reply automatically to customer quick questions": "Awtomatikong sagutin ang mga mabilis na tanong ng mamimili",
  "Replies are labeled automatic. Leave an answer blank to use your saved business details. Bookings and payments still need your confirmation.": "May label na awtomatiko ang mga sagot. Iwang blangko ang sagot para gamitin ang nakalagak na detalye ng negosyo. Kailangan pa rin ng kumpirmasyon mo ang mga pagpapareserba at bayad.",
  "Menu answer": "Sagot tungkol sa talaan ng pagkain",
  "Opening hours answer": "Sagot tungkol sa oras ng pagbubukas",
  "Delivery answer": "Sagot tungkol sa paghahatid",
  "Booking answer": "Sagot tungkol sa pagpapareserba",
  "Custom answers: 3–500 characters, up to 100 words.": "Pasadyang sagot: 3–500 tanda, hanggang 100 salita.",
  "Use the menu button and store posts by default.": "Gamitin bilang paunang pili ang talaan ng pagkain pindutan at mga paskil ng tindahan.",
  "Use your saved opening hours by default.": "Gamitin bilang paunang pili ang nakalagak mong oras ng pagbubukas.",
  "Use your saved delivery options by default.": "Gamitin bilang paunang pili ang nakalagak mong mga paraan ng paghahatid.",
  "Tell customers how to request a booking.": "Sabihin sa mamimili kung paano mag-kahilingan ng pagpapareserba.",
  "Store Cover Photo": "Pabalat larawan ng tindahan",
  "Profile Picture / Store Logo (optional)": "Larawan sa pagkakakilanlan / sagisag ng tindahan (opsyonal)",
  "This large photo appears when a customer taps your store on the map.": "Lalabas ang malaking larawang ito kapag pinindot ng mamimili ang iyong tindahan sa mapa.",
  "Your logo appears beside your store name in the list view. Square images work best.": "Lalabas ang sagisag sa tabi ng pangalan ng tindahan sa listahan. Pinakamainam ang parisukat na larawan.",
  "Remove logo": "Alisin ang sagisag",
  "Remove image": "Alisin ang larawan",
  "Remove selected photo": "Alisin ang napiling larawan",
  "Add a photo": "Magdagdag ng larawan",
  "Add Photo (Menu/Product)": "Magdagdag ng larawan (talaan ng pagkain/produkto)",
  "After approval, edit your profile picture, logo and cover from Business Hub. Manage posts and menu photos on your establishment page.": "Pagkatapos maaprubahan, ayusin ang larawan sa pagkakakilanlan, sagisag, at pabalat sa Sentro ng Negosyo. Pamahalaan ang mga paskil at larawan ng talaan ng pagkain sa pahina ng establisyimento.",
  "About & amenities": "Tungkol at mga pasilidad",
  "About & Amenities": "Tungkol at mga pasilidad",
  "optional": "opsyonal",
  "(optional)": "(opsyonal)",
  "Select only features available at your establishment. Unchecked items will not be shown as available.": "Piliin lang ang mga katangiang mayroon sa iyong establisyimento. Hindi ipapakitang mayroon ang mga hindi naka-check.",
  "Select only details you can confirm for this place.": "Piliin lamang ang mga detalyeng matitiyak mo para sa lugar na ito.",
  "Delivery & Logistics": "Paghahatid at pag-aayos ng paghahatid",
  "In-house Delivery": "Sariling paghahatid",
  "Has in-house delivery": "May sariling paghahatid",
  "Available on Grab/Foodpanda": "Mayroon sa Grab/Foodpanda",
  "Delivery Radius (km)": "Layo ng paghahatid (km)",
  "Delivery distance in km (e.g. 5)": "Layo ng paghahatid sa km (hal. 5)",
  "Opening Hours": "Oras ng pagbubukas",
  "Monday": "Lunes",
  "Tuesday": "Martes",
  "Wednesday": "Miyerkules",
  "Thursday": "Huwebes",
  "Friday": "Biyernes",
  "Saturday": "Sabado",
  "Sunday": "Linggo",
  "e.g. 8AM - 9PM or Closed": "Hal. 8AM - 9PM o Sarado",
  "No price range yet": "Wala pang saklaw ng presyo",
  "Under ₱150": "Mas mababa sa ₱150",
  "Over ₱1,000": "Higit sa ₱1,000",
  "Pin Location *": "I-pananda ang lokasyon *",
  "Click/tap the mini map to move the pin.": "Pindutin ang maliit na mapa para ilipat ang pananda.",
  "Reset pin to my location": "Ibalik ang pananda sa aking lokasyon",
  "Reset map": "Ibalik ang mapa",
  "Reset": "Ibalik",
  "House number, street or subdivision *": "Numero ng bahay, kalye, o subdibisyon *",
  "House no. / Street / Subdivision": "Numero ng bahay / kalye / subdibisyon",
  "Barangay *": "Barangay *",
  "City / Municipality": "Lungsod / munisipalidad",
  "City / municipality *": "Lungsod / munisipalidad *",
  "Short description…": "Maikling paglalarawan…",
  "Short description": "Maikling paglalarawan",
  "e.g., Aling Nena Sari-sari Store": "Hal. Tindahan ni Aling Nena",
  "e.g., 123 Rizal St., Brgy. Sabang": "Hal. 123 Rizal St., Brgy. Sabang",
  "Submit": "Isumite",
  "Submit Changes": "Isumite ang mga pagbabago",
  "Submit for review": "Isumite para masuri",
  "Upload": "Maglakip",
  "Back to Business Hub": "Bumalik sa Sentro ng Negosyo",
  "Back to map": "Bumalik sa mapa",
  "Save establishment": "Ilagak ang establisyimento",
  "Remove from Favorites": "Alisin sa mga paborito",
  "You own this establishment": "Ikaw ang may-ari ng establisyimentong ito",
  "This will appear on your Buzz posts and comments.": "Lalabas ito sa iyong mga Balita paskil at komento.",
  "Install Vicinify": "Idagdag ang Vicinify",
  "Install app": "Idagdag sa aparato",
  "Add Vicinify to your home screen for quick access.": "Idagdag ang Vicinify sa pangunahing tabing ng iyong aparato para madaling mabuksan.",
  "Your account": "Iyong akawnt",
  "Your preferences": "Iyong mga kagustuhan",
  "Open profile and settings": "Buksan ang pagkakakilanlan at mga setting",
  "Main navigation": "Pangunahing nabigasyon",
  "Skip to content": "Lumaktaw sa nilalaman",
  "Vicinify home": "Home ng Vicinify",
  "WORKSPACE": "Lugar-gawaan",
  "YOUR LOCAL COMPANION": "IYONG KASAMA SA KOMUNIDAD",
  "Rooted in Lipa.": "Nag-ugat sa Lipa.",
  "Connected to your community.": "Konektado sa iyong komunidad.",
  "GO SOMEWHERE GOOD": "TUKLASIN ANG MAGAGANDANG LUGAR",
  "Around the": "Sa ating",
  "neighborhood.": "komunidad.",
  "Good food. Local favorites. New discoveries.": "Masarap na pagkain. Mga paborito rito. Mga bagong tuklas.",
  "Explore Lipa": "Tuklasin ang Lipa",
  "Your neighborhood map": "Mapa ng iyong komunidad",
  "Search within this distance": "Maghanap sa loob ng layong ito",
  "Search radius in kilometers": "Layo ng paghahanap sa kilometro",
  "30 km max": "Hanggang 30 km",
  "Map view": "Tingnan ang mapa",
  "List view": "Tingnan ang listahan",
  "Menu": "Pagkain",
  "4+ Rating": "Marka na 4 pataas",
  "A little help from Vici": "Kaunting tulong mula kay Vicinify",
  "Try “coffee nearby” or choose a category to start exploring.": "Subukan ang “kape sa malapit” o pumili ng kategorya para magsimulang tumuklas.",
  "View full establishment": "Tingnan ang buong establisyimento",
  "EXPLORE THIS PLACE": "TUKLASIN ANG LUGAR NA ITO",
  "About this establishment": "Tungkol sa establisyimentong ito",
  "Details not provided yet": "Wala pang ibinigay na detalye",
  "The establishment has not added accessibility, amenities or service details.": "Wala pang idinagdag na detalye tungkol sa daling mapuntahan, pasilidad, o serbisyo ang establisyimento.",
  "Confirm accessibility and service availability with the business before visiting.": "Kumpirmahin sa negosyo ang daling mapuntahan at mga serbisyong mayroon bago bumisita.",
  "Ask the business": "Magtanong sa negosyo",
  "Menu & store posts": "Pagkain at mga paskil ng tindahan",
  "Shared by the business. Confirm current prices and availability before ordering.": "Ibinahagi ng negosyo. Kumpirmahin ang kasalukuyang presyo at pagkakaroon bago umorder.",
  "Showing up to 30 available posts.": "Ipinapakita ang hanggang 30 mayroon na paskil.",
  "Store post": "Paskil ng tindahan",
  "Read post": "Basahin ang paskil",
  "View image": "Tingnan ang larawan",
  "All menu posts": "Lahat ng talaan ng pagkain paskil",
  "Open full-size image": "Buksan ang buong laki ng larawan",
  "No menu uploaded yet": "Wala pang nailakip na talaan ng pagkain",
  "This business has not shared menu or store posts here. Ask them in chat for their current menu.": "Wala pang ibinahaging talaan ng pagkain o paskil ang negosyong ito. Magtanong sa usapan tungkol sa kasalukuyang talaan ng pagkain.",
  "Ask about the menu": "Magtanong tungkol sa talaan ng pagkain",
  "Checking menu and store posts...": "Tinitingnan ang talaan ng pagkain at mga paskil ng tindahan...",
  "Could not load this section": "Hindi maihanda ang seksyong ito",
  "This image could not be loaded. You can still read the post below. Close and reopen the preview to retry.": "Hindi maihanda ang larawan. Mababasa pa rin ang paskil sa ibaba. Isara at buksan muli ang paunang tanaw para subukan ulit.",
  "No public reviews yet": "Wala pang pampublikong pagsusuri",
  "Public customer feedback will appear here when shared.": "Lalabas dito ang pampublikong puna ng mamimili kapag ibinahagi.",
  "Verified transaction": "Beripikadong transaksyon",
  "Verified reviews": "Mga napatunayang pagsusuri",
  "Verified feedback": "Beripikadong puna",
  "Public Reviews": "Mga pampublikong pagsusuri",
  "Public feedback": "Pampublikong puna",
  "Rating": "Marka",
  "No ratings": "Wala pang marka",
  "New · No ratings yet": "Bago · Wala pang marka",
  "Close": "Isara",
  "Close establishment preview": "Isara ang paunang tanaw ng establisyimento",
  "Close menu preview": "Isara ang paunang tanaw ng talaan ng pagkain",
  "View menu or store post": "Tingnan ang talaan ng pagkain o paskil ng tindahan",
  "Close reviews": "Isara ang mga pagsusuri",
  "View full image": "Tingnan ang buong larawan",
  "Open menu photo in full size": "Buksan ang buong laki ng larawan ng talaan ng pagkain",
  "Navigating to destination": "Papunta sa destinasyon",
  "Finding best route…": "Hinahanap ang pinakamainam na ruta…",
  "Could not find a route. Check connection.": "Walang mahanap na ruta. Suriin ang koneksyon.",
  "Steps": "Mga hakbang",
  "Recenter": "Igitna muli",
  "Voice": "Boses",
  "Stop": "Itigil",
  "Tap to hear": "Pindutin para marinig",
  "Show whole route": "Ipakita ang buong ruta",
  "Find my location": "Hanapin ang aking lokasyon",
  "Current Location": "Kasalukuyang lokasyon",
  "Use my location": "Gamitin ang aking lokasyon",
  "Nearby places": "Mga kalapit na lugar",
  "Use of the Platform": "Paggamit ng plataporma",
  "Sign In": "Pumasok",
  "Sign Up": "Magparehistro",
  "Log in": "Pumasok",
  "Sign in to continue to Lipa’s local guide": "Pumasok para magpatuloy sa lokal na gabay ng Lipa",
  "Don't have an account?": "Wala ka pang akawnt?",
  "Already have an account?": "May akawnt ka na?",
  "Create Account": "Magparehistro",
  "Enter your password": "Ilagay ang iyong kontrasenyas",
  "At least 8 characters": "Hindi bababa sa 8 tanda",
  "Repeat new password": "Ulitin ang bagong kontrasenyas",
  "8+ characters": "8 o higit pang tanda",
  "1 Number": "1 numero",
  "1 Special Character (!@#$%)": "1 espesyal na tanda (!@#$%)",
  "1 Uppercase & 1 Lowercase": "1 malaking titik at 1 maliit na titik",
  "Password Strength": "Lakas ng kontrasenyas",
  "Show password": "Ipakita ang kontrasenyas",
  "Enter the email you used for Vicinify. We will send you a secure link to reset your password.": "Ilagay ang sulatroniko na ginamit mo sa Vicinify. Padadalhan ka namin ng ligtas ugnay para ibalik ang kontrasenyas.",
  "Check your inbox and spam folder. The link expires after a short time for your security.": "Tingnan ang kahon ng mensahe at spam folder. May maikling bisa ang ugnay para sa iyong seguridad.",
  "By clicking Create Account, you agree to the": "Sa pagpindot ng Gumawa ng akawnt, sumasang-ayon ka sa",
  "Terms and Conditions": "Mga Tuntunin at Kondisyon",
  "of Vicinify.": "ng Vicinify.",
  "Your neighborhood starts here.": "Dito nagsisimula ang iyong komunidad.",
  "Your neighborhood, discovered.": "Tuklasin ang iyong komunidad.",
  "YOUR NEIGHBORHOOD, DISCOVERED": "TUKLASIN ANG IYONG KOMUNIDAD",
  "A little closer to your community.": "Mas malapit sa iyong komunidad.",
  "Discover Vicinify": "Tuklasin ang Vicinify",
  "Discover local": "Tuklasin ang lokal",
  "Support local": "Suportahan ang lokal",
  "Go somewhere": "Pumunta sa",
  "good.": "magandang lugar.",
  "Your local food guide": "Iyong lokal na gabay sa pagkain",
  "Find somewhere good, close to home.": "Humanap ng magandang lugar malapit sa tahanan.",
  "Find local food spots, compare saved ratings, and discover places around Lipa.": "Maghanap ng lokal na kainan, ihambing ang mga marka, at tumuklas ng mga lugar sa Lipa.",
  "From your morning kapeng barako to a new neighborhood find. Discover the local places that make Lipa, Lipa.": "Mula sa kapeng barako sa umaga hanggang sa bagong tuklas sa komunidad. Kilalanin ang mga lokal na lugar na nagbibigay-buhay sa Lipa.",
  "BOOKINGS & ORDERS": "MGA Pagpapareserba AT Bilin",
  "Booking Purpose": "Layunin ng pagpapareserba",
  "Choose your order": "Piliin ang iyong bilin",
  "Choose a booking or order, then add the details. The business will review your request.": "Pumili ng pagpapareserba o bilin at ilagay ang mga detalye. Susuriin ng negosyo ang iyong kahilingan.",
  "General booking": "Karaniwang pagpapareserba",
  "Reservation": "Reserbasyon",
  "Advance Order": "Paunang bilin",
  "Pickup Pre-order": "Paunang bilin para sa pagkuha",
  "Delivery Order": "Bilin para sa paghahatid",
  "Order Details": "Mga detalye ng bilin",
  "Delivery Address": "Tirahan ng paghahatid",
  "Items, quantity & special instructions": "Mga item, dami, at espesyal na tagubilin",
  "Items, quantity and instructions *": "Mga item, dami, at tagubilin *",
  "Example: items, quantity, special instructions": "Halimbawa: mga item, dami, at espesyal na tagubilin",
  "Add any special request or instruction...": "Magdagdag ng espesyal na kahilingan o tagubilin...",
  "House no., barangay, city & landmark": "Numero ng bahay, barangay, lungsod, at palatandaan",
  "Landmark or location notes *": "Palatandaan o detalye ng lokasyon *",
  "Date, time, and service notes": "Petsa, oras, at mga tala tungkol sa serbisyo",
  "Or type a number": "O maglagay ng bilang",
  "Table or food reservation": "Reserbasyon ng mesa o pagkain",
  "Order now, pick up at the store": "Umorder ngayon at kunin sa tindahan",
  "Future, bulk, cake, bilao, or event orders": "Mga bilin para sa hinaharap, maramihan, cake, bilao, o kaganapan",
  "Advance orders are for future, bulk, cakes, bilao, or events. The business may require downpayment first.": "Ang mga paunang bilin ay para sa hinaharap, maramihan, cake, bilao, o kaganapan. Maaaring humingi muna ng paunang bayad ang negosyo.",
  "Order first — after the business accepts, Vicinify will ask for your address, landmark, and payment reference.": "Umorder muna. Kapag tinanggap ng negosyo, hihingin ng Vicinify ang tirahan, palatandaan, at sanggunian ng bayad.",
  "Address (optional)": "Tirahan (opsyonal)",
  "Address, landmark, payment/reference after owner accepts": "Tirahan, palatandaan, at sanggunian ng bayad matapos tanggapin ng may-ari",
  "Fill out the information the business requested.": "Punan ang impormasyong hinihingi ng negosyo.",
  "Request Requirements": "Mga kailangang isumite",
  "Choose what the customer needs to submit for this transaction.": "Piliin ang kailangang isumite ng mamimili para sa transaksyong ito.",
  "Confirm Requirements": "Kumpirmahin ang mga kailangan",
  "Submit Requirements": "Isumite ang mga kailangan",
  "Confirm Received": "Kumpirmahing natanggap",
  "Accept Request": "Tanggapin ang kahilingan",
  "Start Preparing": "Simulan ang paghahanda",
  "Mark Out for Delivery": "Markahang nasa paghahatid na",
  "Mark Delivered": "Markahang naihatid na",
  "Send request": "Ipadala ang kahilingan",
  "Send Feedback": "Magpadala ng puna",
  "Request sent": "Naipadala",
  "Sending...": "Ipinapadala...",
  "Saving...": "Inilalagak...",
  "Saving to Cloud...": "Inilalagak sa imbakan sa internet...",
  "Updating...": "Binabago...",
  "Saved": "Nailagak",
  "Payment Details": "Mga detalye ng bayad",
  "Payment details": "Mga detalye ng bayad",
  "Payment method": "Paraan ng pagbabayad",
  "Payment Type *": "Uri ng bayad *",
  "Accepted payment methods": "Mga tinatanggap na paraan ng pagbabayad",
  "Other payment method": "Iba pang paraan ng pagbabayad",
  "If Other, type mode of payment": "Kung Iba pa, ilagay ang paraan ng pagbabayad",
  "Amount paid": "Halagang ibinayad",
  "Amount paid (₱) *": "Halagang ibinayad (₱) *",
  "Amount to pay": "Halagang babayaran",
  "Amount submitted": "Halagang isinumite",
  "Reference": "Sanggunian",
  "Reference / transaction number *": "Sanggunian / numero ng transaksyon *",
  "Reference number / payment notes": "Sanggunian number / tala sa bayad",
  "Reference no. / Notes, optional for Cash/COD": "Sanggunian / tala, opsyonal para sa Salapi/COD",
  "Receipt image": "Larawan ng resibo",
  "Enter your reference number. A receipt image is optional.": "Ilagay ang sanggunian number. Opsyonal ang larawan ng resibo.",
  "Enter the number from your payment receipt": "Ilagay ang numero sa iyong resibo",
  "Add payment reference / receipt": "Magdagdag ng sanggunian ng bayad / resibo",
  "Accept payment": "Tanggapin ang bayad",
  "Decline payment": "Tanggihan ang bayad",
  "Decline payment details?": "Tanggihan ang mga detalye ng bayad?",
  "Reason for declining *": "Dahilan ng pagtanggi *",
  "Keep reviewing": "Ipagpatuloy ang pagsusuri",
  "Payment details submitted — please review": "Naisumite na ang detalye ng bayad — pakisuri",
  "Payment instructions / message": "Tagubilin sa pagbabayad / mensahe",
  "Submitting a reference number does not mark your request paid. The business checks the amount and reference against funds actually received.": "Hindi awtomatikong ituturing na bayad ang kahilingan kapag nagsumite ng sanggunian number. Susuriin ng negosyo ang halaga at sanggunian batay sa aktuwal na natanggap na pera.",
  "No receipt image attached. Verify the submitted reference against your actual account.": "Walang kalakip na larawan ng resibo. Ihambing ang sanggunian sa aktuwal mong akawnt.",
  "Receipt image is optional. Verify the submitted reference against your actual account.": "Opsyonal ang larawan ng resibo. Ihambing ang sanggunian sa aktuwal mong akawnt.",
  "Explain which details the customer should provide.": "Kumpirmahin ang kabuuang halaga, paghahatid fee, tatanggap ng bayad, at detalye ng akawnt. Huwag humingi ng Pananda o Minsang kodigo.",
  "The order stays accepted. The customer can correct and resubmit their payment details.": "Mananatiling tanggap ang bilin. Maaaring itama at muling isumite ng mamimili ang detalye ng bayad.",
  "For example: reference not found, amount does not match, or receipt is unclear.": "Halimbawa: hindi makita ang sanggunian, hindi tugma ang halaga, o malabo ang resibo.",
  "Explain what needs correcting. Do not ask the customer to pay again if you have already received the payment.": "Ipaliwanag ang kailangang itama. Huwag pagbayarin muli ang mamimili kung natanggap mo na ang bayad.",
  "1. Pay business": "1. Bayaran ang negosyo",
  "2. Submit proof": "2. Isumite ang patunay",
  "3. Business verifies": "3. Susuriin ng negosyo",
  "Close payment details": "Isara ang mga detalye ng bayad",
  "Close payment review": "Isara ang pagsusuri ng bayad",
  "Cancellation policy": "Patakaran sa pagkansela",
  "Cancellation is closed at this stage. Contact the business if you need help.": "Hindi na maaaring magkansela sa yugtong ito. Makipag-ugnayan sa negosyo kung kailangan ng tulong.",
  "Close cancellation": "Isara ang pagkansela",
  "REVIEW CANCELLATION": "SURIIN ANG PAGKANSELA",
  "If you already paid, follow the refund steps in the transaction summary. Vicinify does not automatically transfer a refund.": "Kung nakapagbayad na, sundan ang mga hakbang sa pagbabalik ng bayad sa buod ng transaksiyon. Hindi kusang nagpapadala ng ibinalik na bayad ang Vicinify.",
  "Cancelled · If paid, contact the business to arrange your refund.": "Kinansela · Kung nakabayad na, kausapin ang negosyo tungkol sa ibabalik na bayad.",
  "will be cancelled. This cannot be undone.": "ay kakanselahin. Hindi na ito maibabalik.",
  "CONVERSATION": "PAG-UUSAP",
  "Conversation": "Pag-uusap",
  "Messages & request updates": "Mga mensahe at pagbabago sa kahilingan",
  "Start a conversation": "Magsimula ng pag-uusap",
  "Your conversations will appear here.": "Lalabas dito ang iyong mga pag-uusap.",
  "Sending to": "Ipapadala kay",
  "Business closed": "Sarado ang negosyo",
  "Open Chat": "Buksan ang usapan",
  "Close conversation": "Isara ang pag-uusap",
  "Send message": "Ipadala ang mensahe",
  "Write a message…": "Sumulat ng mensahe…",
  "Write a comment": "Sumulat ng komento",
  "Write something...": "Sumulat ng mensahe...",
  "Reply": "Sumagot",
  "Hide conversation": "Itago ang pag-uusap",
  "Check details with the business before visiting.": "Kumpirmahin ang mga detalye sa negosyo bago bumisita.",
  "${document.getElementById('chatModal')?.dataset.mode==='transaction'?'Send a message about the selected transaction.':'Ask about the menu, availability, or your request. Choose a quick question below to get started.'}": "Magtanong tungkol sa talaan ng pagkain, pagkakaroon, o iyong kahilingan. Pumili ng mabilis na tanong sa ibaba para magsimula.",
  "Date": "Petsa",
  "Time": "Oras",
  "Guests": "Mga bisita",
  "Notes": "Mga tala",
  "Items": "Mga item",
  "Payment": "Bayad",
  "Delivery address": "Tirahan ng paghahatid",
  "Transaction progress": "Usad ng transaksyon",
  "Progress": "Usad",
  "Transaction completed. Feedback can now be submitted.": "Tapos na ang transaksyon. Maaari nang magbigay ng puna.",
  "Transaction completed. Please rate your experience and send feedback.": "Tapos na ang transaksyon. Markahan ang iyong karanasan at magbigay ng puna.",
  "Requirements confirmed by business.": "Kinumpirma ng negosyo ang mga kailangan.",
  "Submitted. Waiting for business confirmation.": "Naisumite na. Naghihintay ng kumpirmasyon ng negosyo.",
  "Rate Your Experience": "Markahan ang iyong karanasan",
  "Rate & Send Feedback": "Markahan at magpadala ng puna",
  "Feedback / Comment": "Puna / komento",
  "Satisfaction": "Kasiyahan",
  "Not satisfied": "Hindi nasiyahan",
  "Satisfied": "Nasiyahan",
  "Very satisfied": "Lubos na nasiyahan",
  "Neutral": "Katamtaman",
  "Needs improvement": "Kailangan pang pagbutihin",
  "How was your transaction? Your feedback helps improve local establishments.": "Kumusta ang iyong transaksyon? Nakatutulong ang puna mo para mapabuti ang mga lokal na establisyimento.",
  "Write your feedback here, optional but recommended": "Isulat dito ang iyong puna, opsyonal ngunit hinihikayat",
  "Post publicly as a Verified Review": "Ibahagi sa publiko bilang napatunayang pagsusuri",
  "This helps the business build trust. You can uncheck this to keep the feedback inside the transaction only.": "Nakatutulong ito sa tiwala sa negosyo. Alisin ang check kung nais mong manatili lamang sa transaksyon ang puna.",
  "Feedback already submitted. Thank you!": "Naisumite na ang puna. Salamat!",
  "You can't rate your own place.": "Hindi mo maaaring markahan ang sarili mong establisyimento.",
  "Positive Rate": "Bahagdan ng positibong marka",
  "Top Feedback": "Pangunahing puna",
  "Verified Transaction": "Beripikadong transaksyon",
  "Post type": "Uri ng paskil",
  "Post content / text": "Nilalaman / teksto ng paskil",
  "Post details": "Mga detalye ng paskil",
  "General": "Pangkalahatan",
  "Promo": "Alok",
  "Event": "Kaganapan",
  "Tip": "Payo",
  "Announcement": "Anunsyo",
  "Publish": "Ilathala",
  "Add Post": "Magdagdag ng paskil",
  "Add Photo or Video": "Magdagdag ng larawan",
  "Post as Business": "Magpaskil bilang negosyo",
  "Business to post as": "Negosyong gagamitin sa paskil",
  "Share an update, promo, event, or local tip…": "Magbahagi ng pagbabago, alok, kaganapan, o lokal na payo…",
  "Select establishment...": "Pumili ng establisyimento...",
  "Select barangay...": "Pumili ng barangay...",
  "Select Barangay": "Pumili ng barangay",
  "Choose a barangay (optional)": "Pumili ng barangay (opsyonal)",
  "Barangay/area this post belongs to": "Barangay/lugar para sa paskil na ito",
  "No posts for this establishment yet. Click \"Add Post\" to upload a menu or promo!": "Wala pang paskil para sa establisyimentong ito. Pindutin ang \"Magdagdag ng paskil\" para maglakip ng talaan ng pagkain o alok!",
  "Menu board": "Talaan ng pagkain board",
  "Post Menu": "Magpaskil ng talaan ng pagkain",
  "Post Menu / Store Update": "Magpaskil ng talaan ng pagkain / pagbabago ng tindahan",
  "Menu / Promo Details": "Mga detalye ng talaan ng pagkain / alok",
  "Businesses can post best sellers, promos, menus, and new items here.": "Maaaring magpaskil dito ang negosyo ng pinakamahusay seller, alok, talaan ng pagkain, at mga bagong item.",
  "Example: Bestseller milktea - P89 today, or upload your menu photo.": "Halimbawa: Bestseller na tsaa na may gatas - ₱89 ngayon, o ilakip ang larawan ng talaan ng pagkain.",
  "Post actions": "Mga aksyon sa paskil",
  "Share as Promo": "Ibahagi bilang alok",
  "Share as Announcement": "Ibahagi bilang anunsyo",
  "Post update": "Magpaskil ng pagbabago",
  "Shared to Buzz": "Naibahagi sa Balita",
  "Send comment": "Ipadala ang komento",
  "Delete Post": "Burahin ang paskil",
  "Delete Record": "Burahin ang rekord",
  "Delete Establishment": "Burahin ang establisyimento",
  "Delete Account": "Burahin ang akawnt",
  "Delete Data": "Burahin ang datos",
  "Hide Message from Admin": "Itago ang mensahe sa tagapangasiwa",
  "Hide Request from Admin": "Itago ang kahilingan sa tagapangasiwa",
  "Suki Card": "Kard ng Suki",
  "Suki Card Available": "May Suki Kard",
  "Suki Card Studio": "Disenyo ng Kard ng Suki",
  "Enable Suki Card": "Paganahin ang Suki Kard",
  "Your card preview": "Paunang tanaw ng iyong kard",
  "Card details": "Mga detalye ng kard",
  "Cardholder": "May-ari ng kard",
  "Card ID": "Pagkakakilanlan ng kard",
  "Number of stamps": "Bilang ng tatak",
  "Stamp icon": "Sagisag ng tatak",
  "Reward": "Gantimpala",
  "Reward text": "Teksto ng gantimpala",
  "Template": "Padron",
  "(choose a style, then customize)": "(pumili ng estilo, saka baguhin ayon sa gusto)",
  "Color mode": "Paraan ng pagkulay",
  "Solid": "Solidong kulay",
  "Solid color": "Solidong kulay",
  "Gradient": "Unti-unting kulay",
  "Gradient presets": "Mga preset na unti-unting kulay",
  "Custom": "Pasadya",
  "Custom gradient": "Pasadyang unti-unting kulay",
  "Pattern overlay": "Disenyo sa ibabaw",
  "Auto (category)": "Awtomatiko (kategorya)",
  "Flip": "Baligtarin",
  "Flip card": "Baligtarin ang kard",
  "Flip card back": "Ibalik ang kard",
  "Show customer QR": "Ipakita ang QR ng mamimili",
  "Customer QR": "QR ng mamimili",
  "Vicinify Scan": "Vicinify Pagbasa ng kodigo",
  "Claim reward": "Kunin ang gantimpala",
  "Mark as claimed": "Markahang nakuha na",
  "Point the camera at the store's Suki QR. You must be at the establishment — your location will be verified.": "Itutok ang camera sa Suki QR ng tindahan. Kailangang nasa establisyimento ka dahil ibe-verify ang iyong lokasyon.",
  "Let customers scan this code to request a stamp. Review requests before approving.": "Ipa-pagbasa ng kodigo ang kodigo sa mamimili para humiling ng tatak. Suriin ang kahilingan bago aprubahan.",
  "This store has a Suki Card! Log in to see your card and request a stamp.": "May Suki Kard ang tindahang ito! Pumasok para makita ang iyong kard at humiling ng tatak.",
  "You don't have a Suki Card yet.": "Wala ka pang Suki Kard.",
  "You don't have a Suki Card yet. Visit a store and scan with Vicinify!": "Wala ka pang Suki Kard. Bumisita sa tindahan at mag-pagbasa ng kodigo gamit ang Vicinify!",
  "Flip the card to see the reward and claim status. Show the QR or tap Scan with Vicinify on the store page to request a stamp.": "Baligtarin ang kard para makita ang gantimpala at katayuan ng pagkuha. Ipakita ang QR o pindutin ang Pagbasa ng kodigo with Vicinify sa pahina ng tindahan para humiling ng tatak.",
  "Could not load Suki Cards right now.": "Hindi maihanda ang mga Suki Kard sa ngayon.",
  "Could not load the Suki Card right now.": "Hindi maihanda ang Suki Kard sa ngayon.",
  "Could not load the QR library.": "Hindi maihanda ang QR library.",
  "Ask Vici": "Magtanong sa Vicinify",
  "Ask Vici AI": "Magtanong sa Vicinify",
  "Ask Vici AI...": "Magtanong kay Vicinify Katulong...",
  "Ask about food, places, or your next coffee…": "Magtanong tungkol sa pagkain, mga lugar, o susunod mong kape…",
  "AI conversation": "Pag-uusap sa Katulong",
  "Recent chats": "Mga nakaraang usapan",
  "Recent AI chats": "Mga nakaraang Katulong usapan",
  "New chat": "Bagong usapan",
  "On this device": "Sa aparato na ito",
  "Show recent chats": "Ipakita ang mga nakaraang usapan",
  "Close recent chats": "Isara ang mga nakaraang usapan",
  "Minimize Vici AI": "Paliitin ang Vicinify Katulong",
  "Close Vici AI": "Isara ang Vicinify Katulong",
  "Send to Vici AI": "Ipadala kay Vicinify Katulong",
  "No strong match yet": "Wala pang tugmang resulta",
  "Try asking": "Subukang magtanong",
  "Try again": "Subukan muli",
  "Later": "Mamaya",
  "Looking through local places": "Tinitingnan ang mga lokal na lugar",
  "Try widening the radius or using another food/category word.": "Subukang palawakin ang layo o gumamit ng ibang pagkain/kategorya sa paghahanap.",
  "Ranked by location, ratings, food match, freshness, and availability.": "Inayos ayon sa lokasyon, marka, tugma sa pagkain, pagiging bago ng impormasyon, at pagkakaroon.",
  "View on Map": "Tingnan sa mapa",
  "View on map": "Tingnan sa mapa",
  "Hide Vici AI": "Itago ang Vicinify Katulong",
  "Hide smart picks": "Itago ang mga napiling lugar",
  "Vici AI is currently unavailable. Please try again later.": "Hindi magamit ngayon ang katulong ng Vicinify. Pakisubukan muli mamaya.",
  "AI timed out. Please try again.": "Naubos ang oras ng Katulong. Pakisubukan muli.",
  "Search": "Maghanap",
  "Search Vicinify": "Maghanap sa Vicinify",
  "Open store": "Buksan ang tindahan",
  "Title": "Pamagat",
  "Enter title": "Ilagay ang pamagat",
  "Type": "Uri",
  "Report Info": "Iulat ang impormasyon",
  "Wrong hours": "Maling oras",
  "Wrong location": "Maling lokasyon",
  "Wrong contact": "Maling kontak",
  "Report submitted": "Naisumite ang ulat",
  "Add details so admin can verify quickly": "Magdagdag ng detalye para masuri agad ng tagapangasiwa",
  "Permanent admin — role is locked": "Permanenteng tagapangasiwa — hindi mababago ang tungkulin",
  "Verified by admin": "Beripikado ng tagapangasiwa",
  "Accepted MOP:": "Tinatanggap na paraan ng pagbabayad:",
  "Is verified": "Beripikado",
  "Accepts booking": "Tumatanggap ng pagpapareserba",
  "No changes": "Walang pagbabago",
  "Dismiss": "Alisin",
  "Remove": "Alisin",
  "Attach My Current Location": "Ilakip ang aking lokasyon",
  "Customer attaches their current location": "Ilalakip ng mamimili ang kasalukuyan niyang lokasyon",
  "Location not attached yet.": "Wala pang kalakip na lokasyon.",
  "Amount, mode of payment & reference": "Halaga, paraan ng pagbabayad, at sanggunian",
  "Date:": "Petsa:",
  "Time:": "Oras:",
  "Items / Order:": "Mga item / bilin:",
  "Payment Method:": "Paraan ng pagbabayad:",
  "Notes:": "Mga tala:",
  "Delivery Address:": "Tirahan ng paghahatid:",
  "Feedback:": "Puna:",
  "Rating:": "Marka:",
  "Satisfaction:": "Kasiyahan:",
  "Business note:": "Tala ng negosyo:",
  "Address:": "Tirahan:",
  "Barangay:": "Barangay:",
  "City:": "Lungsod:",
  "Reference:": "Sanggunian:",
  "Amount:": "Halaga:",
  "Method:": "Paraan:",
  "Mode of Payment:": "Paraan ng pagbabayad:",
  "Payment details submitted": "Naisumite na ang detalye ng bayad",
  "Waiting for online payment proof. Verify the received payment before preparation.": "Naghihintay ng patunay ng sa internet na bayad. Patunayan ang natanggap na bayad bago maghanda.",
  "Please log in to view.": "Pumasok para makita.",
  "Please select at least one requirement above.": "Pumili ng kahit isang kailangan sa itaas.",
  "You’re offline. Some features need an internet connection.": "Walang koneksiyon ka. Nangangailangan ng internet ang ilang gamit.",
  "Accessibility": "Daling mapuntahan",
  "Service options": "Mga paraan ng serbisyo",
  "Amenities": "Mga pasilidad",
  "Highlights": "Mga tampok",
  "Dining options": "Mga paraan ng pagkain",
  "Offerings": "Mga iniaalok",
  "Payments": "Mga paraan ng pagbabayad",
  "Parking": "Paradahan",
  "Wheelchair-accessible entrance": "Pasukang naa-pahintulot ng wheelchair",
  "Wheelchair-accessible parking": "Paradahang naa-pahintulot ng wheelchair",
  "Wheelchair-accessible restroom": "Palikurang naa-pahintulot ng wheelchair",
  "Wheelchair-accessible seating": "Upuang naa-pahintulot ng wheelchair",
  "Takeout": "Pag-uuwi ng pagkain",
  "Outdoor seating": "Upuan sa labas",
  "Wi-Fi": "Wi-Fi",
  "Restroom": "Palikuran",
  "Air conditioning": "Pagpapalamig ng hangin",
  "Coffee specialty": "Espesyalidad sa kape",
  "Fresh pastries": "Mga bagong tinapay",
  "Live music": "Agad na musika",
  "Live sports": "Agad na palakasan",
  "Breakfast": "Almusal",
  "Lunch": "Tanghalian",
  "Dinner": "Hapunan",
  "Groups": "Mga grupo",
  "Solo dining": "Kainan para sa mag-isa",
  "Coffee": "Kape",
  "Tea": "Tsaa",
  "Desserts": "Mga panghimagas",
  "Vegetarian options": "Mga pagkaing walang karne",
  "Cash": "Salapi",
  "Bank transfer": "Paglilipat sa bangko",
  "Credit cards": "Mga kredito kard",
  "Debit cards": "Mga debito kard",
  "Free parking": "Libreng paradahan",
  "Paid parking": "May bayad na paradahan",
  "Street parking": "Paradahan sa kalye",
  "Admin Hub": "Sentro ng Tagapangasiwa",
  "Admin workspace": "Sentro ng Tagapangasiwa",
  "Your workspace": "Iyong lugar-gawaan",
  "Community Buzz": "Balita ng komunidad",
  "Add a place": "Magdagdag ng lugar",
  "Place details": "Mga detalye ng lugar",
  "Edit establishment": "Baguhin ang establisyimento",
  "Business posts": "Mga paskil ng negosyo",
  "Welcome": "Maligayang pagdating",
  "Local explorer": "Lokal na tagatuklas",
  "Your neighborhood": "Iyong komunidad",
  "Manage establishments, users, posts, claims, and reports in one place.": "Pamahalaan sa iisang lugar ang mga establisyimento, gumagamit, paskil, pag-angkin, at ulat.",
  "Manage your listings, daily operations, and customer messages.": "Pamahalaan ang mga listing, araw-araw na operasyon, at mensahe ng mamimili.",
  "Buzz Posts": "Mga Balita paskil",
  "Additional Details": "Karagdagang detalye",
  "Amount Requested:": "Hinihinging halaga:",
  "Assigning owner for:": "Itinatakda ang may-ari para sa:",
  "Authentication": "Pagpapatunay ng pagkakakilanlan",
  "Barangay location": "Lokasyon sa barangay",
  "Business requested:": "Hiniling ng negosyo:",
  "Choose category": "Pumili ng kategorya",
  "Claimant": "Naghahabol ng pagmamay-ari",
  "Click to manually assign owner": "Pindutin para magtalaga ng may-ari",
  "Click to view on map": "Pindutin para makita sa mapa",
  "Consultation, inquiry, appointment...": "Konsultasyon, pagtatanong, appointment...",
  "Could not load. Please try again later.": "Hindi maihanda. Pakisubukan muli mamaya.",
  "Design your store's loyalty stamp card. The preview is live — drag to rotate, tap": "Idisenyo ang loyalty tatak kard ng tindahan. Agad ang paunang tanaw — i-hilahin para paikutin, pindutin",
  "(drag to rotate, tap": "(i-hilahin para paikutin, pindutin",
  "Display name of poster": "Pangalang ipapakita ng nagpaskil",
  "Display name of the sender": "Pangalang ipapakita ng nagpadala",
  "Enter user's email...": "Ilagay ang sulatroniko ng gumagamit...",
  "Enter user's registered email address:": "Ilagay ang rehistradong sulatroniko ng gumagamit:",
  "Filipino (Tagalog)": "Filipino (Tagalog)",
  "Food finder for Vicinify": "Tagahanap ng pagkain sa Vicinify",
  "Hi, I can help you find food places, compare ratings, check distance, and suggest what fits your location.": "Kumusta! Matutulungan kitang maghanap ng kainan, maghambing ng marka, tumingin ng layo, at pumili ng bagay sa lokasyon mo.",
  "House/Street:": "Bahay/kalye:",
  "Landmark / Notes:": "Palatandaan / mga tala:",
  "Landmark / Location notes e.g., tabi ng red na bahay, malapit sa kanto, blue gate": "Palatandaan / tala sa lokasyon, hal. katabi ng pulang bahay, malapit sa kanto, asul na gate",
  "Message text from customer": "Teksto ng mensahe ng mamimili",
  "No public reviews yet. Completed transactions will appear here as verified reviews when customers choose public posting.": "Wala pang pampublikong pagsusuri. Lalabas dito ang mga pagsusuri mula sa natapos na transaksyon kapag piniling ibahagi ng mamimili sa publiko.",
  "Paid directly to": "Direktang binayaran kay",
  "Places from this search": "Mga lugar mula sa paghahanap na ito",
  "Public feedback signal": "Palatandaan ng pampublikong puna",
  "Recommended": "Inirerekomenda",
  "Reference / Notes:": "Sanggunian / mga tala:",
  "Reply from the business owner": "Sagot mula sa may-ari ng negosyo",
  "Status:": "Katayuan:",
  "Street address in Lipa City": "Tirahan ng kalye sa Lipa City",
  "Type of establishment": "Uri ng establisyimento",
  "Type of post": "Uri ng paskil",
  "Unable to load reviews.": "Hindi maihanda ang mga pagsusuri.",
  "What are you craving?": "Ano ang gusto mong kainin?",
  "Your request with": "Ang kahilingan mo sa",
  "accepted / confirmed": "tinanggap / kinumpirma",
  "e.g. Free coffee": "Hal. libreng kape",
  "e.g. GCash, Maya, Cash, Bank Transfer": "Hal. GCash, Maya, salapi, paglilipat sa bangko",
  "e.g., 5": "Hal. 5",
  "to flip)": "para baligtarin)",
  "to flip. Works even without internet or quota.": "para baligtarin. Gumagana kahit walang internet o natitirang hangganan ng paggamit.",
  "✅ Requirements Submitted": "✅ Naisumite ang mga kailangan",
  "✓ Verified Transaction": "✓ Beripikadong transaksyon",
  "⭐ Rate & Feedback": "⭐ Marka at puna",
  "⭐ 1 - Bad Experience": "⭐ 1 - Hindi magandang karanasan",
  "⭐⭐ 2 - Not Satisfied": "⭐⭐ 2 - Hindi nasiyahan",
  "⭐⭐⭐ 3 - Okay": "⭐⭐⭐ 3 - Katamtaman",
  "⭐⭐⭐⭐ 4 - Satisfied": "⭐⭐⭐⭐ 4 - Nasiyahan",
  "⭐⭐⭐⭐⭐ 5 - Very Satisfied": "⭐⭐⭐⭐⭐ 5 - Lubos na nasiyahan",
  "🌟 Customer Feedback": "🌟 Puna ng mamimili",
  "🏠 Delivery Address": "🏠 Tirahan ng paghahatid",
  "💳 Payment Details": "💳 Mga detalye ng bayad",
  "💳 Payment Summary": "💳 Buod ng bayad",
  "📍 Delivery Card": "📍 Kard ng paghahatid",
  "📍 Shared Location": "📍 Ibinahaging lokasyon",
  "📝 Order Details": "📝 Mga detalye ng bilin",
  "🧾 Order Summary": "🧾 Buod ng bilin",
  "1. What would you like to do?": "1. Ano ang nais mong gawin?",
  "1. Use of the Platform": "1. Paggamit ng plataporma",
  "2. Account Responsibilities": "2. Mga pananagutan sa akawnt",
  "3. System Limitations": "3. Mga limitasyon ng sistema",
  "4. Data Accuracy": "4. Katumpakan ng datos",
  "5. General User Obligations": "5. Mga pangkalahatang tungkulin ng gumagamit",
  "6. Terms of Participating Food Establishments": "6. Mga tuntunin para sa mga kalahok na kainan",
  "Welcome to Vicinify: An AI-Assisted Food Establishment Locator and Recommendation System in Lipa City. By creating an account and using Vicinify, you agree to the following terms. Please read them carefully.": "Maligayang pagdating sa Vicinify, isang sistema na may tulong ng Katulong para maghanap at magrekomenda ng mga kainan sa Lipa City. Sa paggawa ng akawnt at paggamit ng Vicinify, sumasang-ayon ka sa mga sumusunod na tuntunin. Pakibasa nang mabuti.",
  "Vicinify may update these terms from time to time. Continued use of the platform after an update means the user accepts the updated terms.": "Maaaring baguhin ng Vicinify ang mga tuntuning ito paminsan-minsan. Ang patuloy na paggamit matapos ang pagbabago ay nangangahulugang tinatanggap ng gumagamit ang nabago na mga tuntunin.",
  "You may cancel for free while your request is still pending. Once the establishment accepts it, cancelling refunds the establishment's stated rate (shown on your order card). Once preparation starts, cancellation is no longer available.": "Maaari kang magkansela nang libre habang naghihintay pa ang kahilingan. Kapag tinanggap na ng establisyimento, ang ibabalik na bayad ay ayon sa nakasaad nitong rate sa iyong bilin kard. Hindi na maaaring magkansela kapag nagsimula ang paghahanda.",
  "Success": "Tagumpay",
  "Something went wrong": "May nagkaproblema",
  "Heads up": "Paalala",
  "Info": "Impormasyon",
  "Confirm": "Kumpirmahin",
  "Accept this payment?": "Tanggapin ang bayad na ito?",
  "Account Not Verified": "Hindi pa napatunayan ang akawnt",
  "Account created successfully! A verification link has been sent to your email. Please verify to access all features.": "Nagawa na ang akawnt! Naipadala sa sulatroniko mo ang pagpapatunay ugnay. Magpa-verify para magamit ang lahat ng gamit.",
  "Admin access is required for this action.": "Kailangan ang pahintulot ng tagapangasiwa para sa aksyong ito.",
  "Business Profile Updated Successfully!": "Nabago na ang pagkakakilanlan ng negosyo!",
  "Business info confirmed. Freshness status updated.": "Nakumpirma ang detalye ng negosyo. Nabago ang katayuan ng impormasyon.",
  "Business name must be at least 3 characters.": "Kailangang may hindi bababa sa 3 tanda ang pangalan ng negosyo.",
  "Business name must be at most 120 characters.": "Hanggang 120 tanda lamang ang pangalan ng negosyo.",
  "Cancellation is no longer available at this stage.": "Hindi na maaaring magkansela sa yugtong ito.",
  "Change Role": "Palitan ang tungkulin",
  "Claim Business": "I-pag-angkin ang negosyo",
  "Claim approved. The claimant is now the establishment owner.": "Naaprubahan ang pag-angkin. Ang nag-pag-angkin na ang may-ari ng establisyimento.",
  "Claim not found.": "Hindi makita ang pag-angkin.",
  "Claim request sent! Show the card to the owner.": "Naipadala ang pag-angkin kahilingan! Ipakita ang kard sa may-ari.",
  "Claim request submitted for admin review.": "Naisumite ang pag-angkin kahilingan para suriin ng tagapangasiwa.",
  "Clear recent AI chats?": "Burahin ang mga nakaraang Katulong usapan?",
  "Confirm Completed": "Kumpirmahing tapos na",
  "Could not load payment details. Try again.": "Hindi maihanda ang detalye ng bayad. Subukan muli.",
  "Could not load the scanner. Please check your connection and try again.": "Hindi maihanda ang pambasa ng kodigo. Suriin ang koneksyon at subukan muli.",
  "Could not open post. Please try again.": "Hindi mabuksan ang paskil. Pakisubukan muli.",
  "Could not open the camera. Please allow camera access and try again.": "Hindi mabuksan ang camera. Payagan ang pahintulot sa camera at subukan muli.",
  "Could not open this conversation. Please try again.": "Hindi mabuksan ang pag-uusap. Pakisubukan muli.",
  "Could not update status. Please try again.": "Hindi mabago ang katayuan. Pakisubukan muli.",
  "Current password is incorrect.": "Mali ang kasalukuyang kontrasenyas.",
  "Delete Update": "Burahin ang pagbabago",
  "Delivery request accepted. Delivery details card is now ready for the customer.": "Tinanggap ang kahilingan sa paghahatid. Handa na ang kard ng detalye para sa mamimili.",
  "Delivery status updated.": "Nabago ang katayuan ng paghahatid.",
  "Description must be at least 10 characters.": "Kailangang may hindi bababa sa 10 tanda ang paglalarawan.",
  "Description must be at most 1000 characters.": "Hanggang 1000 tanda lamang ang paglalarawan.",
  "Enter a valid amount greater than zero, with up to two decimal places.": "Maglagay ng wastong halagang higit sa zero, hanggang dalawang decimal place.",
  "Error updating favorites. Please try again later.": "Hindi mabago ang mga paborito. Pakisubukan muli mamaya.",
  "Error: No user found with that email. Make sure they registered in the app first.": "Walang gumagamit na may sulatroniko na iyon. Tiyaking nakarehistro muna siya sa aplikasyon.",
  "Establishment Submitted to Cloud! (Pending Admin Approval)": "Naisumite na ang establisyimento sa imbakan sa internet! Naghihintay ng pag-apruba ng tagapangasiwa.",
  "Establishment approved and published!": "Naaprubahan at nailathala ang establisyimento!",
  "Establishment name must be at least 3 characters.": "Kailangang may hindi bababa sa 3 tanda ang pangalan ng establisyimento.",
  "Free database quota is exhausted for today. Please try again later.": "Naubos na ang libreng imbakan ng datos hangganan ng paggamit ngayong araw. Pakisubukan muli mamaya.",
  "Getting your location...": "Kinukuha ang iyong lokasyon...",
  "Give Feedback": "Magbigay ng puna",
  "Hide Chat": "Itago ang usapan",
  "Hide Conversation": "Itago ang pag-uusap",
  "Hide Record": "Itago ang rekord",
  "Location is not supported on this device.": "Hindi suportado ng aparato na ito ang lokasyon.",
  "Location sharing is not supported on this device.": "Hindi suportado ng aparato na ito ang pagbabahagi ng lokasyon.",
  "Log in to comment!": "Pumasok para magkomento!",
  "Map reset to defaults.": "Naibalik ang paunang pili na ayos ng mapa.",
  "Marked as claimed. 🎁": "Namarkahang nakuha na. 🎁",
  "Maximum 5 photos only": "Hanggang 5 larawan lamang",
  "Menu/store post published.": "Nailathala na ang talaan ng pagkain/paskil ng tindahan.",
  "Mini map not ready.": "Hindi pa handa ang maliit na mapa.",
  "Mini map not ready. Paki-refresh ang page.": "Hindi pa handa ang maliit na mapa. Paki-muling buksan ang pahina.",
  "Missing establishment details.": "Kulang ang detalye ng establisyimento.",
  "Navigation is still loading. Check your connection.": "Inihahanda pa ang paglalakbay. Suriin ang koneksyon.",
  "Navigation stopped.": "Itinigil ang paglalakbay.",
  "New password and confirmation do not match.": "Hindi magkatugma ang bagong kontrasenyas at kumpirmasyon.",
  "New password must be at least 8 characters with uppercase, lowercase, a number, and a special character (!@#$%).": "Kailangang may hindi bababa sa 8 tanda ang bagong kontrasenyas, na may malaking titik, maliit na titik, numero, at espesyal na tanda (!@#$%).",
  "No active delivery/details request yet. Wait for the business to accept or request details.": "Wala pang aktibong kahilingan sa paghahatid/detalye. Hintaying tanggapin ito ng negosyo o humingi sila ng detalye.",
  "No establishment selected.": "Walang napiling establisyimento.",
  "Only the approved business owner can post as this establishment.": "Ang naaprubahang may-ari lamang ang maaaring magpaskil bilang establisyimentong ito.",
  "Only the approved owner or an admin can share this post.": "Ang naaprubahang may-ari o tagapangasiwa lamang ang maaaring magbahagi ng paskil na ito.",
  "Only the business owner can request requirements from a customer.": "Ang may-ari lamang ng negosyo ang maaaring humingi ng mga kailangan mula sa mamimili.",
  "Only the owner or an admin can delete this update.": "Ang may-ari o tagapangasiwa lamang ang maaaring magbura ng pagbabago na ito.",
  "Only the owner or an admin can edit the Suki Card.": "Ang may-ari o tagapangasiwa lamang ang maaaring magbago ng Suki Kard.",
  "Only the owner or an admin can edit this business profile.": "Ang may-ari o tagapangasiwa lamang ang maaaring magbago ng pagkakakilanlan ng negosyo.",
  "Only the owner or an admin can edit this post.": "Ang may-ari o tagapangasiwa lamang ang maaaring magbago ng paskil na ito.",
  "Only the owner or an admin can post updates for this establishment.": "Ang may-ari o tagapangasiwa lamang ang maaaring magpaskil ng pagbabago para sa establisyimentong ito.",
  "Open a customer conversation from Business Hub → Messages.": "Buksan ang pag-uusap ng mamimili sa Sentro ng Negosyo → Mga Mensahe.",
  "Open the Map page once to load the post modal.": "Buksan muna ang Mapa para maihanda ang paskil pormularyo.",
  "Password cannot be empty.": "Hindi maaaring walang laman ang kontrasenyas.",
  "Password reset email sent! Please check your inbox or spam folder.": "Naipadala ang sulatroniko para sa pagbabalik ng kontrasenyas! Tingnan ang kahon ng mensahe o spam folder.",
  "Password updated successfully!": "Napalitan na ang kontrasenyas!",
  "Payment details submitted. Waiting for business verification.": "Naisumite ang detalye ng bayad. Naghihintay ng pagpapatunay ng negosyo.",
  "Photos only. Please choose an image.": "Mga larawan lamang. Pumili ng larawan.",
  "Pin moved to your location.": "Nailipat ang pananda sa iyong lokasyon.",
  "Please add a caption or upload a photo!": "Maglagay ng paliwanag sa larawan o maglakip ng larawan!",
  "Please add a short detail for admin.": "Maglagay ng maikling detalye para sa tagapangasiwa.",
  "Please agree to the Terms and Conditions to create your account.": "Sumang-ayon muna sa Mga Tuntunin at Kondisyon para gumawa ng akawnt.",
  "Please attach your current location.": "Ilakip ang iyong kasalukuyang lokasyon.",
  "Please choose today or a future date and time.": "Piliin ang kasalukuyan o darating na petsa at oras.",
  "Please complete the delivery address, city, and landmark/location notes.": "Kumpletuhin ang tirahan ng paghahatid, lungsod, at palatandaan/tala ng lokasyon.",
  "Please create a Strong Password based on the requirements below.": "Gumawa ng malakas na kontrasenyas ayon sa mga kailangan sa ibaba.",
  "Please enter additional details.": "Ilagay ang karagdagang detalye.",
  "Please enter the amount paid.": "Ilagay ang halagang ibinayad.",
  "Please enter the delivery address.": "Ilagay ang tirahan ng paghahatid.",
  "Please enter the number of guests.": "Ilagay ang bilang ng mga bisita.",
  "Please enter the order/items details.": "Ilagay ang detalye ng bilin/mga item.",
  "Please enter your email and password.": "Ilagay ang iyong sulatroniko at kontrasenyas.",
  "Please enter your full name.": "Ilagay ang iyong buong pangalan.",
  "Please enter your online payment reference number so the business can verify it.": "Ilagay ang sanggunian number ng sa internet na bayad para ma-verify ito ng negosyo.",
  "Please fill Business Name, Category, Address, Barangay, and Description.": "Punan ang pangalan ng negosyo, kategorya, tirahan, barangay, at paglalarawan.",
  "Please fill Business Name, Category, Description, and Address.": "Punan ang pangalan ng negosyo, kategorya, paglalarawan, at tirahan.",
  "Please fill Name, Category, Description, Address, and Barangay.": "Punan ang pangalan, kategorya, paglalarawan, tirahan, at barangay.",
  "Please fill in current, new, and confirm password fields.": "Punan ang kasalukuyang kontrasenyas, bagong kontrasenyas, at kumpirmasyon ng kontrasenyas.",
  "Please log in first to access the chat.": "Pumasok muna para magamit ang usapan.",
  "Please log in first.": "Pumasok muna.",
  "Please log in to like!": "Pumasok para mag-like!",
  "Please log in to save favorites.": "Pumasok para mag-save ng mga paborito.",
  "Please open the Map page at least once to load the Modal system.": "Buksan muna ang Mapa para maihanda ang mga kahon ng usapan.",
  "Please select a Date and Time.": "Pumili ng petsa at oras.",
  "Please select a payment method.": "Pumili ng paraan ng pagbabayad.",
  "Please select a valid rating.": "Pumili ng wastong marka.",
  "Please select an establishment!": "Pumili ng establisyimento!",
  "Please select at least one requirement.": "Pumili ng kahit isang kailangan.",
  "Please verify your email address first.": "Patunayan muna ang iyong sulatroniko tirahan.",
  "Post content is empty!": "Walang laman ang paskil!",
  "Post deleted successfully.": "Nabura na ang paskil.",
  "Post no longer exists.": "Wala na ang paskil.",
  "Post published.": "Nailathala na ang paskil.",
  "Profile saved successfully to Cloud!": "Nailagak na sa imbakan sa internet ang iyong pagkakakilanlan!",
  "Question sent. Automatic reply is unavailable right now; the business can still respond.": "Naipadala ang tanong. Hindi mayroon ngayon ang awtomatikong sagot; maaari pa ring sumagot ang negosyo.",
  "Rating saved.": "Nailagak na ang marka.",
  "Record successfully updated!": "Nabago na ang rekord!",
  "Remove Favorite": "Alisin sa mga paborito",
  "Removed from favorites.": "Naalis sa mga paborito.",
  "Report submitted. Admin can review it.": "Naisumite na ang ulat. Maaari na itong suriin ng tagapangasiwa.",
  "Request cancelled. Any refund must be arranged with the business.": "Kinansela ang kahilingan. Kausapin ang negosyo tungkol sa anumang ibabalik na bayad.",
  "Requirement request no longer exists.": "Wala na ang kahilingan para sa mga kailangan.",
  "Requirement request sent.": "Naipadala ang kahilingan para sa mga kailangan.",
  "Requirement response no longer exists.": "Wala na ang sagot sa mga kailangan.",
  "Requirements confirmed. Verify online payment proof before starting preparation.": "Nakumpirma ang mga kailangan. Patunayan ang patunay ng sa internet na bayad bago maghanda.",
  "Requirements submitted.": "Naisumite ang mga kailangan.",
  "Reset Password": "Ibalik ang kontrasenyas",
  "Role updated successfully!": "Nabago na ang tungkulin!",
  "Send this request?": "Ipadala ang kahilingan na ito?",
  "Showing a limited catalog. Some establishments may not appear.": "Limitadong katalogo ang ipinapakita. Maaaring may mga establisyimentong hindi kasama.",
  "Something went wrong. Check console.": "May nagkaproblema. Tingnan ang console.",
  "Stamp approved! 🎉": "Naaprubahan ang tatak! 🎉",
  "Stamp request cancelled.": "Kinansela ang tatak kahilingan.",
  "Stamp request rejected.": "Tinanggihan ang tatak kahilingan.",
  "Store not found.": "Hindi makita ang tindahan.",
  "Success! Establishment Submitted for Admin Approval.": "Tagumpay! Naisumite ang establisyimento para sa pag-apruba ng tagapangasiwa.",
  "Success! Establishment approved and published.": "Tagumpay! Naaprubahan at nailathala ang establisyimento.",
  "Successfully added to favorites!": "Naidagdag sa mga paborito!",
  "Suki Card saved!": "Nailagak na ang Suki Kard!",
  "Thank you! Your rating and feedback were submitted.": "Salamat! Naisumite ang iyong marka at puna.",
  "That password is too weak.": "Masyadong mahina ang kontrasenyas.",
  "This establishment has no valid map location.": "Walang wastong lokasyon sa mapa ang establisyimentong ito.",
  "This establishment is unavailable.": "Hindi mayroon ang establisyimentong ito.",
  "This is the permanent admin account. Its role can never be changed.": "Ito ang permanenteng tagapangasiwa akawnt. Hindi mababago ang tungkulin nito.",
  "This is your own establishment. You cannot send a request to yourself.": "Sarili mong establisyimento ito. Hindi ka maaaring magpadala ng kahilingan sa sarili mo.",
  "This menu/store post no longer exists.": "Wala na ang talaan ng pagkain/paskil ng tindahang ito.",
  "This place is no longer available on the map.": "Hindi na mayroon sa mapa ang lugar na ito.",
  "This request is not awaiting online payment details.": "Hindi naghihintay ng detalye ng sa internet na bayad ang kahilingan na ito.",
  "This store has no Suki Card.": "Walang Suki Kard ang tindahang ito.",
  "This update cannot be deleted because its record ID is missing.": "Hindi mabura ang pagbabago dahil walang tala Pagkakakilanlan.",
  "This update was already deleted.": "Nabura na ang pagbabago na ito.",
  "Too many failed attempts. Please try again later.": "Masyadong maraming bigong pagsubok. Pakisubukan muli mamaya.",
  "Too many failed attempts. Please wait a few minutes.": "Masyadong maraming bigong pagsubok. Maghintay ng ilang minuto.",
  "Transaction completed. Please leave a rating and feedback.": "Tapos na ang transaksyon. Magbigay ng marka at puna.",
  "Transaction confirmed. Please leave a rating and feedback.": "Nakumpirma ang transaksyon. Magbigay ng marka at puna.",
  "Transaction history is kept for records and cannot be deleted.": "Iniingatan ang kasaysayan ng transaksyon at hindi ito maaaring burahin.",
  "Unable to get location. Please allow location permission.": "Hindi makuha ang lokasyon. Payagan ang pahintulot sa lokasyon.",
  "Unable to get your location. Please allow location permission.": "Hindi makuha ang iyong lokasyon. Payagan ang pahintulot sa lokasyon.",
  "Unable to load this establishment.": "Hindi maihanda ang establisyimentong ito.",
  "Unable to verify the establishment for this post.": "Hindi ma-verify ang establisyimento para sa paskil na ito.",
  "Verification email sent! Please check your inbox or spam folder.": "Naipadala na ang pagpapatunay sulatroniko! Tingnan ang kahon ng mensahe o spam folder.",
  "We need your location to start navigation.": "Kailangan ang iyong lokasyon para simulan ang paglalakbay.",
  "You already have a pending claim for this establishment.": "May naghihintay ka nang pag-angkin para sa establisyimentong ito.",
  "You already submitted feedback for this transaction.": "Nakapagbigay ka na ng puna para sa transaksyong ito.",
  "You cannot favorite your own establishment.": "Hindi mo maaaring gawing paborito ang sarili mong establisyimento.",
  "You cannot open another customer’s conversation.": "Hindi mo maaaring buksan ang pag-uusap ng ibang mamimili.",
  "You must be logged in to add an establishment.": "Kailangang nakapasok para magdagdag ng establisyimento.",
  "You must be logged in to change your password.": "Kailangang nakapasok para palitan ang kontrasenyas.",
  "You must be logged in to reset your password.": "Kailangang nakapasok para ibalik ang kontrasenyas.",
  "You must be logged in to save your profile.": "Kailangang nakapasok para i-save ang pagkakakilanlan.",
  "You need to log in to post!": "Kailangan mong pumasok para magpaskil!",
  "Your account has been removed from the system. You will be logged out.": "Inalis na ang iyong akawnt sa sistema. Ilalabas ka.",
  "Your account is already verified or you are not logged in.": "Beripikado na ang akawnt mo o hindi ka nakapasok.",
  "Your account is unverified. Please check your email to verify your account.": "Hindi pa napatunayan ang akawnt mo. Tingnan ang sulatroniko para patunayan ito.",
  "Your sign-in account and profile were deleted. Related history records may remain for business and transaction records.": "Nabura na ang iyong sign-in akawnt at pagkakakilanlan. Maaaring manatili ang kaugnay na kasaysayan para sa mga rekord ng negosyo at transaksyon.",
  "❌ INCORRECT PASSWORD! Account deletion failed.": "❌ MALI ANG Kontrasenyas! Hindi nabura ang akawnt.",
  "Error:": "Suliranin:",
  "Error saving:": "Hindi nailagak:",
  "Error sending request:": "Hindi naipadala ang kahilingan:",
  "Error sending message:": "Hindi naipadala ang mensahe:",
  "Error sending email:": "Hindi naipadala ang sulatroniko:",
  "Error saving profile:": "Hindi nailagak ang pagkakakilanlan:",
  "Error deleting post:": "Hindi nabura ang paskil:",
  "Error deleting conversation:": "Hindi nabura ang pag-uusap:",
  "Error logging out:": "Hindi makapag-talaan out:",
  "Error loading more:": "Hindi maihanda ang karagdagan:",
  "Error adding establishment:": "Hindi naidagdag ang establisyimento:",
  "Error confirming completed:": "Hindi nakumpirma ang pagkumpleto:",
  "Error confirming received:": "Hindi nakumpirma ang pagtanggap:",
  "Error confirming requirements:": "Hindi nakumpirma ang mga kailangan:",
  "Error updating delivery status:": "Hindi nabago ang katayuan ng paghahatid:",
  "Error updating record:": "Hindi nabago ang rekord:",
  "Error updating request:": "Hindi nabago ang kahilingan:",
  "Error submitting feedback:": "Hindi naisumite ang puna:",
  "Error submitting requirements:": "Hindi naisumite ang mga kailangan:",
  "Error opening requirement form:": "Hindi mabuksan ang pormularyo ng mga kailangan:",
  "Unable to confirm info:": "Hindi makumpirma ang impormasyon:",
  "Unable to share to Buzz:": "Hindi maibahagi sa Balita:",
  "Unable to submit claim:": "Hindi maisumite ang pag-angkin:",
  "Unable to submit report:": "Hindi maisumite ang ulat:",
  "Could not cancel this request.": "Hindi makansela ang kahilingan na ito.",
  "Payment review was not saved.": "Hindi nailagak ang pagsusuri ng bayad.",
  "Vegan options": "Mga pagkaing mula lamang sa halaman",
  "Late-night food": "Pagkain sa gabi",
  "Updated today": "Nabago ngayong araw",
  "Needs confirmation": "Kailangang kumpirmahin",
  "Unconfirmed": "Hindi pa nakumpirma",
  "List": "Listahan",
  "View full-size image": "Tingnan ang buong laki ng larawan",
  "No written feedback.": "Walang nakasulat na puna.",
  "Just now": "Ngayon lang",
  "Sent": "Naipadala",
  "Seen": "Nabasa",
  "Expired": "Nag-expire",
  "Payment Submitted": "Naisumite ang bayad",
  "Payment Confirmed": "Nakumpirma ang bayad",
  "Out for Delivery": "Papasok na sa paghahatid",
  "Unverified": "Hindi napatunayan",
  "Stamp request sent! Please wait for the owner's approval.": "Naipadala ang tatak kahilingan! Hintaying aprubahan ng may-ari.",
  "You already have a pending stamp request — waiting for the owner's approval.": "May naghihintay ka nang tatak kahilingan — hinihintay ang pag-apruba ng may-ari.",
  "This is your own store — you can't request a stamp from yourself.": "Sarili mong tindahan ito — hindi ka maaaring humiling ng tatak sa sarili mo.",
  "stamps": "mga tatak",
  "All Barangays": "Lahat ng barangay",
  "No establishments found.": "Walang nakitang establisyimento.",
  "Your local companion": "Iyong kasama sa komunidad",
  "Vicinify helps users discover, locate, and learn about food establishments in Lipa City through an interactive map, a list view, AI-assisted recommendations (Vici AI), reservations and order requests, real-time chat, the Buzz community feed, and the Suki Card loyalty feature. The platform may be used only for lawful, personal, and non-commercial purposes related to these features.": "Tinutulungan ng Vicinify ang mga gumagamit na tumuklas at makilala ang mga kainan sa Lipa City sa pamamagitan ng mapa, listahan, mga rekomendasyon ng Vicinify Katulong, reserbasyon at bilin kahilingan, agad usapan, Balita, at Suki Kard. Gamitin lamang ang plataporma para sa legal, personal, at di-komersyal na layuning kaugnay ng mga gamit na ito.",
  "Users must provide true and accurate information when registering and are responsible for keeping their password confidential and for all activities performed under their account. A verified email address is required before an account can post content, send requests, or perform other write actions in the system. Users must immediately stop using an account that is not theirs.": "Dapat magbigay ang gumagamit ng totoo at tamang impormasyon sa pagpaparehistro. Pananagutan niya ang pagiging lihim ng kontrasenyas at lahat ng aktibidad sa akawnt. Kailangan ang napatunayang sulatroniko bago makapagpapaskil, makapagpadala ng kahilingan, o makapagsulat ng datos sa sistema. Itigil agad ang paggamit sa akawnt na hindi sa iyo.",
  "Vicinify is a locator and recommendation platform. Distances and locations depend on the accuracy of the device's GPS and on available map data, and recommendations given by Vici AI are suggestions based on listed information, not guarantees of quality, price, or availability. Vicinify does not process payments inside the application and does not operate delivery services; some features may also be unavailable during maintenance or connectivity problems.": "Ang Vicinify ay plataporma para sa paghahanap at rekomendasyon. Nakadepende ang layo at lokasyon sa GPS ng aparato at mayroon na mapa. Ang rekomendasyon ng Vicinify Katulong ay batay sa nakalistang impormasyon at hindi garantiya ng kalidad, presyo, o pagkakaroon. Hindi nagpoproseso ng bayad o nagpapatakbo ng paghahatid ang Vicinify. Maaaring hindi mayroon ang ilang gamit habang may maintenance o problema sa koneksyon.",
  "Establishment information such as addresses, operating hours, menus, prices, and availability is provided and maintained by the establishments and contributing users, and may change without notice. Users are encouraged to verify important details with the establishment and to report incorrect information through the Report feature so it can be reviewed by the administrators.": "Ang tirahan, oras, talaan ng pagkain, presyo, at pagkakaroon ay inilalagay at pinananatili ng mga establisyimento at nag-aambag na gumagamit. Maaaring magbago ang mga ito nang walang abiso. Kumpirmahin ang mahahalagang detalye sa establisyimento at gamitin ang pag-uulat para maitama ng tagapangasiwa ang maling impormasyon.",
  "Users must not submit false establishments, false reviews, spam, or abusive content in any part of the platform, including Buzz posts and chat messages. Reviews may be submitted only after a completed transaction with the establishment. Administrators may remove content or restrict accounts that violate these terms.": "Bawal ang pekeng establisyimento, pekeng pagsusuri, spam, o mapang-abusong nilalaman, kabilang ang Balita at usapan. Maaari lamang mag-pagsusuri matapos ang natapos na transaksyon sa establisyimento. Maaaring alisin ng tagapangasiwa ang nilalaman o limitahan ang akawnt na lumalabag sa mga tuntunin.",
  "Participating food establishments may set their own terms regarding reservations, bookings, pre-orders, cancellations and refund percentages, pickup arrangements, and delivery arrangements, which are shown in the request process, including the cancellation policy notice. Payment is arranged directly between the user and the establishment. Users are responsible for reviewing and following the applicable establishment terms before proceeding with any request.": "Maaaring magtakda ang kalahok na kainan ng sariling tuntunin para sa reserbasyon, pagpapareserba, paunang bilin, pagkansela, ibabalik na bayad, pagkuha, at paghahatid. Ipinapakita ang mga ito sa pag-kahilingan, kasama ang patakaran sa pagkansela. Direktang inaayos ng gumagamit at establisyimento ang bayad. Pananagutan ng gumagamit na basahin at sundin ang naaangkop na tuntunin bago mag-kahilingan.",
  "Location is approximate. Enable precise location for better nearby results.": "Tinatayang lokasyon pa ito. Paganahin ang eksaktong lokasyon para mas tumpak ang mga kalapit na resulta.",
  "Try location": "Hanapin muli",
  "Enable location": "Paganahin ang lokasyon",
  "Locating…": "Kinukuha ang lokasyon…",
  "Finding your location. Allow access when your browser asks.": "Hinahanap ang iyong lokasyon. Payagan ang pahintulot kapag hiniling ng pantingin sa internet.",
  "Location ready": "Nakuha na ang lokasyon",
  "Location is not supported in this browser. Use Safari, Chrome or Edge.": "Hindi suportado ng pantingin sa internet na ito ang lokasyon. Gumamit ng Safari, Chrome, o Edge.",
  "Location requires a secure HTTPS connection.": "Kailangan ng ligtas na HTTPS connection para sa lokasyon.",
  "Could not get a valid location. Please try again.": "Hindi makakuha ng wastong lokasyon. Pakisubukan muli.",
  "Location blocked. Open browser site settings and allow Location. On iPhone, also enable Location Services and Precise Location.": "Naka-block ang lokasyon. Payagan ang Lokasyon sa mga setting ng site sa pantingin sa internet. Sa iPhone, paganahin rin ang Lokasyon Services at Precise Lokasyon.",
  "Location unavailable. Turn on device Location Services and try again.": "Hindi mayroon ang lokasyon. Paganahin ang Lokasyon Services ng aparato at subukan muli.",
  "Location timed out. Check GPS or move near a window, then retry.": "Naubos ang oras sa pagkuha ng lokasyon. Suriin ang GPS o lumapit sa bintana at subukan muli.",
  "Could not find your location. Please retry.": "Hindi makita ang iyong lokasyon. Pakisubukan muli.",
  "cafe": "Kapihan",
  "restaurant": "Restawran",
  "bakery": "Panaderya",
  "milktea": "Tsaa na may gatas",
  "snackhouse": "Meryendahan",
  "foodstall": "Puwesto ng pagkain",
  "eatery": "Karinderya",
  "dessert": "Panghimagas",
  "fastfood": "Mabilisang kainan",
  "Error": "Suliranin",
  "No details provided.": "Walang ibinigay na detalye.",
  "Freshness": "Pagiging bago ng impormasyon",
  "Vici AI": "Katulong ng Vicinify",
  "Choose photo": "Pumili ng larawan",
  "Choose photos": "Pumili ng mga larawan",
  "No photo selected": "Walang napiling larawan",
  "Cheap coffee nearby": "Murang kape sa malapit",
  "Milk tea open now": "Tsaa na may gatas na bukas ngayon",
  "Best food near me": "Masarap na pagkain sa malapit",
  "Delivery nearby": "Paghahatid sa malapit",
  "Could not get an answer": "Hindi makakuha ng sagot",
  "Vici AI is unavailable. Please try again.": "Hindi magamit ngayon ang katulong ng Vicinify. Pakisubukan muli.",
  "Vici AI could not connect. Please try again.": "Hindi makakonekta ang katulong ng Vicinify. Pakisubukan muli.",
  "Overview": "Pangkalahatang tanaw",
  "Feedback": "Puna",
  "Review": "Pagsusuri",
  "Choose File": "Pumili ng larawan",
  "No file chosen": "Walang napiling larawan",
  "true": "Oo",
  "false": "Hindi",
  "Forest": "Kagubatan",
  "Mint Linen": "Telang lunti",
  "Kraft": "Kayumangging papel",
  "Minimal White": "Payak na puti",
  "Midnight": "Hatinggabi",
  "Sorbetes Pastel": "Mapusyaw na sorbetes",
  "Sunset": "Takipsilim",
  "Ocean": "Karagatan",
  "Matcha": "Luntiang tsaa",
  "Berry": "Munting bungang-kahoy",
  "No file selected": "Walang napiling larawan",
  "Current transaction": "Kasalukuyang transaksiyon",
  "Choose transaction": "Pumili ng transaksiyon",
  "Accept or decline this request.": "Tanggapin o tanggihan ang kahilingang ito.",
  "Wait for the business to accept your request.": "Hintaying tanggapin ng negosyo ang iyong kahilingan.",
  "Waiting for the customer to submit payment details.": "Hinihintay ang detalye ng bayad mula sa mamimili.",
  "Pay the agreed amount once, then submit your reference.": "Bayaran nang isang beses ang napagkasunduang halaga, saka isumite ang sanggunian ng bayad.",
  "The business must set the amount and payment instructions first.": "Kailangang ilagay muna ng negosyo ang halaga at paraan ng pagbabayad.",
  "Edit payment instructions": "Baguhin ang tagubilin sa pagbabayad",
  "Set payment instructions": "Ilagay ang tagubilin sa pagbabayad",
  "Correct payment details": "Iwasto ang detalye ng bayad",
  "Submit payment reference": "Isumite ang sanggunian ng bayad",
  "Use earlier payment details": "Gamitin ang naunang detalye ng bayad",
  "Check the reference and money received before verifying payment.": "Suriin ang sanggunian at perang natanggap bago kumpirmahin ang bayad.",
  "Payment is under review. Do not pay again.": "Sinusuri ang bayad. Huwag magbayad muli.",
  "Verify payment": "Kumpirmahin ang bayad",
  "Request correction": "Humiling ng pagwawasto",
  "Payment and preparation are separate steps.": "Magkahiwalay ang pagkumpirma ng bayad at paghahanda.",
  "The business is preparing your request.": "Inihahanda ng negosyo ang iyong kahilingan.",
  "Your request is ready.": "Handa na ang iyong kahilingan.",
  "Your order is on the way.": "Papunta na ang iyong bilin.",
  "Confirm only after you receive the order or service.": "Kumpirmahin lamang kapag natanggap na ang bilin o serbisyo.",
  "Verify the actual payment received before calculating the refund.": "Tiyakin muna ang perang natanggap bago kwentahin ang ibabalik.",
  "Verify received payment": "Tiyakin ang perang natanggap",
  "Payment not found": "Hindi makita ang bayad",
  "Refund due. The business must transfer it manually.": "May halagang dapat ibalik. Kailangang ipadala ito ng negosyo.",
  "Record refund transfer": "Itala ang pagpapadala ng ibinalik na bayad",
  "The business recorded a refund transfer. Confirm after checking your account.": "Naitala ng negosyo na naipadala na ang ibinalik na bayad. Kumpirmahin matapos suriin ang iyong kuwenta.",
  "Confirm refund received": "Kumpirmahing natanggap ang ibinalik na bayad",
  "The customer confirmed the refund was received.": "Kinumpirma ng mamimili na natanggap ang ibinalik na bayad.",
  "The business could not find this payment. Check the reference before requesting a recheck.": "Hindi nakita ng negosyo ang bayad. Suriin ang sanggunian bago humiling ng muling pagsusuri.",
  "Request payment recheck": "Ipasuri muli ang bayad",
  "Cancelled. No refund is due.": "Kinansela. Walang halagang kailangang ibalik.",
  "Cancelled. Ask the business to review any earlier payment.": "Kinansela. Ipasuri sa negosyo ang anumang naunang bayad.",
  "This request is closed.": "Sarado na ang kahilingang ito.",
  "Amount due": "Halagang dapat bayaran",
  "Submitted payment": "Isinumiteng bayad",
  "Refund amount": "Halagang ibabalik",
  "Payment and request details": "Detalye ng bayad at kahilingan",
  "Refund reference": "Sanggunian ng ibinalik na bayad",
  "Business note": "Paalala ng negosyo",
  "Vicinify records manual payments and refunds. It does not transfer money.": "Itinatala ng Vicinify ang mga direktang bayad at ibinalik na halaga. Hindi ito nagpapadala ng pera.",
  "Amount due now (₱)": "Halagang dapat bayaran ngayon (₱)",
  "Payment recipient and instructions": "Tatanggap ng bayad at mga tagubilin",
  "Include the recipient name, account number and agreed amount. This does not confirm a payment.": "Ilagay ang pangalan ng tatanggap, bilang ng kuwenta at napagkasunduang halaga. Hindi nito kinukumpirma na may natanggap na bayad.",
  "Amount actually received (₱)": "Halagang talagang natanggap (₱)",
  "Check your account first. The refund will be calculated using the saved cancellation rate.": "Suriin muna ang iyong kuwenta. Gagamitin sa pagkukuwenta ang nakatalang bahagdan ng ibabalik.",
  "Explain what needs checking": "Ipaliwanag ang kailangang suriin",
  "The customer can ask you to recheck. This does not mark a refund received.": "Maaaring humiling ang mamimili ng muling pagsusuri. Hindi nito minamarkahang natanggap na ang ibinalik na bayad.",
  "Refund transfer reference": "Sanggunian ng pagpapadala ng ibinalik na bayad",
  "Transfer the displayed refund amount yourself first. Recording a reference does not move money.": "Ipadala muna ang nakasaad na halagang ibabalik. Ang pagtatala ng sanggunian ay hindi nagpapadala ng pera.",
  "Record transfer": "Itala ang pagpapadala",
  "Check your account and confirm you received the displayed refund amount.": "Suriin ang iyong kuwenta at kumpirmahing natanggap mo ang nakasaad na halagang ibinalik.",
  "Use earlier payment details?": "Gamitin ang naunang detalye ng bayad?",
  "Check this reference belongs to the selected request. It will still require payment verification.": "Tiyaking para sa napiling kahilingan ang sangguniang ito. Kailangan pa ring kumpirmahin ang bayad.",
  "Transaction updated.": "Nabago na ang transaksiyon.",
  "Transaction summary could not load. Please try reopening the conversation.": "Hindi maipakita ang buod ng transaksiyon. Suriin ang talatuntunan ng talaan at buksan muli ang usapan.",
  "Use the current transaction summary to submit payment details.": "Gamitin ang buod ng kasalukuyang transaksiyon sa pagsusumite ng detalye ng bayad.",
  "Accept a transaction first, then set payment instructions in its summary.": "Tanggapin muna ang transaksiyon, saka ilagay ang tagubilin sa pagbabayad sa buod nito.",
  "Payment instructions saved in the transaction summary.": "Naitala na sa buod ng transaksiyon ang tagubilin sa pagbabayad.",
  "Delivery accepted. Submit your address, landmark and location here. Payment is handled separately in the current transaction summary.": "Tinanggap ang paghahatid. Isumite rito ang iyong tirahan, palatandaan at lokasyon. Hiwalay ang pagbabayad sa buod ng kasalukuyang transaksiyon.",
  "Customer submitted the requested transaction details.": "Isinumite ng mamimili ang hinihinging detalye ng transaksiyon.",
  "Earlier payment details": "Naunang detalye ng bayad",
  "Payment verification is shown in the current transaction summary. Confirming these details does not verify a payment.": "Makikita sa buod ng kasalukuyang transaksiyon ang pagkumpirma ng bayad. Ang pagtanggap sa mga detalyeng ito ay hindi pagkumpirma ng bayad.",
  "Details confirmed — payment is separate": "Tinanggap na ang mga detalye — hiwalay ang bayad",
  "Details submitted for review": "Isinumite na ang mga detalye para masuri",
  "No payment is recorded. No refund transfer is needed.": "Walang naitalang bayad. Walang halagang kailangang ibalik.",
  "The business must verify money received before a refund is calculated. Follow the refund status in the transaction summary.": "Kailangang tiyakin muna ng negosyo ang perang natanggap bago kwentahin ang ibabalik. Subaybayan ang kalagayan nito sa buod ng transaksiyon.",
  "Wait for the business to set the amount and payment instructions.": "Hintaying ilagay ng negosyo ang halaga at tagubilin sa pagbabayad.",
  "The submitted amount does not match the agreed amount due. Ask the business to correct the amount if needed; do not pay twice.": "Hindi tugma ang isinumiteng halaga sa napagkasunduang bayad. Ipaayos sa negosyo ang halaga kung kailangan; huwag magbayad nang dalawang beses.",
  "Enter the payment recipient and instructions (8–1000 characters).": "Ilagay ang tatanggap ng bayad at mga tagubilin (8–1000 tanda).",
  "Enter the refund transfer reference.": "Ilagay ang sanggunian ng ibinalik na bayad.",
  "Only the business can set payment instructions before payment review.": "Ang negosyo lamang ang maaaring magtakda ng tagubilin bago suriin ang bayad.",
  "Verify the received payment and refundable amount first.": "Tiyakin muna ang perang natanggap at halagang ibabalik.",
  "This refund action is not available for your account or the current stage.": "Hindi maaari ang pagkilos na ito para sa iyong kuwenta o kasalukuyang hakbang.",
  "No refund due": "Walang halagang ibabalik",
  "Refund status": "Kalagayan ng ibinalik na bayad",
  "needs verification": "Kailangang tiyakin",
  "payment not found": "Hindi makita ang bayad",
  "not required": "Hindi kailangan",
  "Mark fulfilled": "Markahang natupad",
  "Mark ready": "Markahang handa",
  "Transaction completed.": "Natapos na ang transaksiyon.",
  "Set payment instructions first.": "Ilagay muna ang tagubilin sa pagbabayad.",
  "Check the agreed amount before using this payment.": "Suriin ang napagkasunduang halaga bago gamitin ang bayad na ito.",
  "Refund calculation": "Pagkukuwenta ng ibabalik",
  "Follow the refund status in the current transaction summary.": "Subaybayan ang pagbabalik ng bayad sa buod ng kasalukuyang transaksiyon.",
  "Waiting for payment instructions": "Hinihintay ang tagubilin sa pagbabayad",
  "Add the delivery address before the final amount is set.": "Ilagay muna ang tirahan ng paghahatiran bago itakda ang huling halaga.",
  "Add delivery address": "Ilagay ang paghahatiran",
  "House number, street or subdivision": "Bilang ng bahay, kalye o pamayanan",
  "The business uses this address to confirm the total and delivery fee.": "Gagamitin ng negosyo ang tirahang ito upang tiyakin ang kabuuang halaga at bayad sa paghahatid.",
  "Wait for the delivery address before setting the final amount.": "Hintayin ang paghahatiran bago itakda ang huling halaga.",
  "Delivery details can only be submitted by the customer after acceptance.": "Ang mamimili lamang ang maaaring magsumite ng paghahatiran matapos tanggapin ang kahilingan.",
  "Complete the delivery address and landmark.": "Kumpletuhin ang tirahan ng paghahatiran at palatandaan.",
  "The delivery address is required before preparation.": "Kailangan muna ang paghahatiran bago maghanda.",
  "Set the agreed amount and payment instructions before preparation.": "Ilagay muna ang napagkasunduang halaga at tagubilin sa pagbabayad bago maghanda.",
  "Start preparing?": "Simulan na ang paghahanda?",
  "Starting preparation closes customer cancellation. Verify payment and delivery details first.": "Hindi na maaaring magkansela ang mamimili kapag nagsimula na ang paghahanda. Tiyakin muna ang bayad at detalye ng paghahatid.",
  "Request progress": "Takbo ng kahilingan",
  "Requirements": "Mga hinihingi",
  "Payment setup": "Kasunduan sa bayad",
  "Preparation": "Paghahanda",
  "Completed": "Natapos",
  "Needed": "Kulang pa",
  "Submitted": "Naipasa",
  "Confirmed": "Kinumpirma",
  "Review the submitted details before continuing.": "Suriin muna ang naipasang detalye bago magpatuloy.",
  "Your details were submitted. Wait for business review.": "Naipasa na ang iyong detalye. Hintaying suriin ito ng negosyo.",
  "Waiting for the requested customer details.": "Hinihintay ang hinihinging detalye mula sa mamimili.",
  "Complete the requested details to continue.": "Kumpletuhin ang hinihinging detalye upang makapagpatuloy.",
  "Submit requirements": "Ipasa ang mga hinihingi",
  "Confirm details": "Kumpirmahin ang mga detalye",
  "Skip requested details": "Hindi na kailangan ang mga detalye",
  "Waive these requirements?": "Huwag nang hingin ang mga ito?",
  "Continue without the requested details? This does not confirm payment.": "Magpatuloy nang hindi na hinihingi ang mga detalye? Hindi nito kinukumpirma ang bayad.",
  "Instructions (optional)": "Mga tagubilin (maaaring laktawan)",
  "Explain which details the customer should provide.": "Ipaliwanag kung anong detalye ang kailangang ibigay ng mamimili.",
  "Details confirmed. Payment verification is separate.": "Kinumpirma na ang mga detalye. Hiwalay ang pagkumpirma ng bayad.",
  "Review or waive the requested details before preparation.": "Suriin muna o huwag nang hingin ang mga detalye bago maghanda.",
  "Requirements can only be changed after acceptance and before payment review or preparation.": "Maaari lamang baguhin ang mga hinihingi matapos tanggapin ang kahilingan at bago suriin ang bayad o maghanda.",
  "Only the business can request details.": "Ang negosyo lamang ang maaaring humingi ng detalye.",
  "Review or waive the current requirements before creating another request.": "Suriin o huwag nang hingin ang kasalukuyang detalye bago gumawa ng panibagong kahilingan.",
  "Choose at least one requirement.": "Pumili ng kahit isang kailangang detalye.",
  "Requirement notes are too long.": "Masyadong mahaba ang tagubilin sa mga hinihingi.",
  "No requirements are attached to this transaction.": "Walang dagdag na detalye na hinihingi sa transaksiyong ito.",
  "These requirements were replaced. Open the current transaction summary.": "Napalitan na ang mga hinihingi. Buksan ang kasalukuyang buod ng transaksiyon.",
  "Only the customer can submit the requested details.": "Ang mamimili lamang ang maaaring magpasa ng hinihinging detalye.",
  "These details have already been submitted.": "Naipasa na ang mga detalyeng ito.",
  "Complete all requested details.": "Kumpletuhin ang lahat ng hinihinging detalye.",
  "Attach a valid current location.": "Ilagay ang wastong kasalukuyang lokasyon.",
  "Only the business can review requirements.": "Ang negosyo lamang ang maaaring magsuri ng mga hinihingi.",
  "The customer must submit the current requirements first.": "Kailangang maipasa muna ng mamimili ang kasalukuyang hinihingi.",
  "These requirements are already closed.": "Sarado na ang paghiling sa mga detalyeng ito.",
  "Choose a valid requirements action.": "Pumili ng wastong pagkilos sa mga hinihingi.",
  "Review the requested details before setting the amount.": "Suriin muna ang hinihinging detalye bago itakda ang halaga.",
  "Complete and confirm the requested details before payment.": "Kumpletuhin at kumpirmahin muna ang mga hinihinging detalye bago magbayad.",
  "Requirements do not belong to this transaction.": "Hindi para sa transaksiyong ito ang mga hinihingi.",
  "Business requested transaction details.": "Humingi ang negosyo ng mga detalye ng transaksiyon.",
  "Manage my establishments": "Pamahalaan ang aking mga negosyo",
  "Hide owner tools": "Itago ang mga gamit ng may-ari",
  "No status": "Walang nakatalang kalagayan",
  "Requirements requested": "Humingi ng mga detalye",
  "Requirements submitted": "Naipasa ang mga hinihingi",
  "Completion request": "Paghingi ng pagkumpirma sa pagtatapos",
  "Feedback request": "Paghingi ng puna",
  "Feedback submitted": "Naipasa ang puna",
  "Transaction update": "Pagbabago sa transaksiyon",
  "No additional details needed": "Wala nang kailangang detalye",
  "Request the details you need, or confirm that no additional details are required.": "Hingin ang kailangan mong detalye o kumpirmahing wala nang kailangan.",
  "The business is checking the requirements before payment.": "Sinusuri muna ng negosyo ang mga kailangan bago ang bayad.",
  "Confirm that the request already contains everything needed. Payment instructions come next.": "Kumpirmahing kumpleto na ang kahilingan. Susunod ang tagubilin sa pagbabayad.",
  "Confirm the requirements or choose no additional details first.": "Kumpirmahin muna ang mga kailangan o piliing wala nang kailangan.",
  "Estimated menu subtotal": "Tinatayang subtotal ng menu",
  "Request reference": "Sanggunian ng kahilingan",
  "Requirements waived": "Hindi na hinihingi ang mga detalye",
  "Waived": "Hindi na kailangan",
  "Acceptance": "Pagtanggap",
  "Completion": "Pagtatapos",
  "No requests to show.": "Walang kahilingang maipapakita.",
  "Record deleted": "Binurang tala",
  "Record hidden": "Itinagong tala",
  "Role changed": "Binagong tungkulin",
  "Owner assigned": "Itinalagang may-ari",
  "Claim approved": "Inaprubahang pag-angkin",
  "Claim rejected": "Tinanggihang pag-angkin",
  "Report resolved": "Naaksyunang ulat",
  "Report dismissed": "Isinantabing ulat",
  "New role": "Bagong tungkulin",
  "Vici AI cannot accept requests from this site address. Please contact the site administrator.": "Hindi makatanggap ang katulong ng Vicinify ng kahilingan mula sa adres ng pahinang ito. Makipag-ugnayan sa tagapangasiwa.",
  "Vici AI server setup is incomplete. Please contact the site administrator.": "Hindi pa kumpleto ang pagsasaayos ng katulong ng Vicinify. Makipag-ugnayan sa tagapangasiwa.",
  "Too many AI requests. Please wait before trying again.": "Masyadong maraming kahilingan sa katulong. Maghintay bago muling subukan.",
  "Please sign in again with a verified email to use Vici AI.": "Mag-sign in muli gamit ang napatunayang adres ng elektronikong liham upang magamit ang katulong ng Vicinify.",
  "How to install": "Paano idagdag",
  "App installed": "Naidagdag na ang aplikasyon",
  "Resume Vici AI": "Buksan muli ang katulong ng Vicinify",
  "Delete chat": "Burahin ang usapan",
  "Request recorded": "Naitala ang kahilingan",
  "Customer submitted transaction details.": "Isinumite ng mamimili ang mga detalye ng transaksiyon.",
  "Transaction progress updated.": "Na-update ang pag-usad ng transaksiyon.",
  "Open messages": "Buksan ang mga mensahe",
  "Open transactions": "Buksan ang mga transaksiyon",
  "Open transaction": "Buksan ang transaksiyon",
  "Payment verified. The business can now prepare your request.": "Natiyak na ang bayad. Maaari nang ihanda ng negosyo ang iyong kahilingan.",
  "Refund rate before preparation": "Bahagi ng bayad na ibabalik bago magsimula ang paghahanda",
  "Cancellation closes when preparation starts.": "Hindi na maaaring magkansela kapag nagsimula na ang paghahanda.",
  "Open inquiries": "Buksan ang mga tanong",
  "Inquiries": "Mga tanong",
  "Transaction": "Transaksiyon",
  "Request, payment and progress": "Kahilingan, bayad, at pag-usad",
  "Questions and messages": "Mga tanong at mensahe",
  "Additional reservation details": "Karagdagang detalye ng pagpapareserba",
  "Only ask for information missing from the reservation.": "Hingin lamang ang detalyeng kulang sa pagpapareserba.",
  "Skip requested details?": "Hindi na kailangan ang mga detalye?",
  "These details will no longer be required. Payment must still be verified before preparation.": "Hindi na hihingin ang mga detalyeng ito. Kailangang tiyakin pa rin ang bayad bago maghanda.",
  "Delete account": "Burahin ang account",
  "Check your obligations before permanently removing your account.": "Suriin ang mga pananagutan bago tuluyang burahin ang iyong account.",
  "Confirm your password": "Kumpirmahin ang iyong kontrasenyas",
  "Check account": "Suriin ang account",
  "Checking account obligations…": "Sinusuri ang mga pananagutan ng account…",
  "Resume cleanup": "Ipagpatuloy ang paglilinis",
  "Cleanup progress": "Pag-usad ng paglilinis",
  "Removing account data. Keep this window open; you can resume if interrupted.": "Binubura ang datos ng account. Panatilihing bukas ang pahina; maaaring ituloy kapag naputol.",
  "Account cleanup was started. Resume to finish.": "Nagsimula na ang paglilinis ng account. Ipagpatuloy upang matapos.",
  "Account cleanup was started. Confirm your password to resume.": "Nagsimula na ang paglilinis ng account. Kumpirmahin ang kontrasenyas upang magpatuloy.",
  "Your account was deleted.": "Nabura na ang iyong account.",
  "Your account was deleted. Shared transaction records retain only essential history without your profile details.": "Nabura na ang iyong account. Mahahalagang tala lamang ng pinagsaluhang transaksiyon ang nananatili, nang wala ang mga detalye ng iyong pagkakakilanlan.",
  "Transfer administrator responsibilities before deleting this account.": "Ilipat muna ang mga tungkulin ng tagapangasiwa bago burahin ang account.",
  "Complete or properly cancel active transactions first.": "Tapusin o wastong kanselahin muna ang mga kasalukuyang transaksiyon.",
  "Resolve refunds and obtain receipt confirmation first.": "Ayusin muna ang pagsasauli ng bayad at kumpirmahin ang pagtanggap nito.",
  "Resolve or withdraw pending business claims first.": "Ayusin o bawiin muna ang nakabinbing pag-angkin ng negosyo.",
  "Accept or cancel pending ownership transfers first.": "Tanggapin o kanselahin muna ang nakabinbing paglilipat ng pagmamay-ari.",
  "Contact support to process this account.": "Makipag-ugnayan sa tagapangasiwa upang maproseso ang account.",
  "Deletion is blocked. Nothing has been deleted.": "Hindi pa maaaring burahin ang account. Wala pang nabura.",
  "Close my establishments permanently instead of transferring them.": "Tuluyang isara ang aking mga establisimyento sa halip na ilipat ang pagmamay-ari.",
  "Your login, profiles and personal data will be removed. Essential shared transaction history and anonymous ratings remain. This cannot be undone.": "Buburahin ang iyong pagpasok sa account, pagkakakilanlan, at personal na datos. Mananatili ang mahahalagang tala ng transaksiyon at mga markang walang pagkakakilanlan. Hindi na ito maibabalik.",
  "Account checks passed. Confirm only when you are ready.": "Pumasa ang pagsusuri sa account. Kumpirmahin lamang kapag handa ka na.",
  "Permanently delete account": "Tuluyang burahin ang account",
  "Transfer ownership": "Ilipat ang pagmamay-ari",
  "Message about this transaction...": "Mensahe tungkol sa transaksiyong ito...",
  "This transaction conversation is archived. You can read it in history.": "Naka-archive na ang usapang ito. Mababasa mo ito sa kasaysayan.",
  "Transaction conversation archived. The record remains in history.": "Naka-archive na ang usapan. Nananatili ang tala sa kasaysayan.",
  "The business must review and approve the calculated refund.": "Kailangang suriin at aprubahan ng negosyo ang halagang ibabalik.",
  "Review refund": "Suriin ang ibabalik na bayad",
  "Approve refund": "Aprubahan ang ibabalik na bayad",
  "Refund approved. Transfer the displayed amount, then record the reference.": "Aprubado na ang refund. Ipadala ang nakasaad na halaga, saka itala ang sanggunian.",
  "The customer reported the refund was not received. Check the transfer before recording a correction.": "Iniulat ng customer na hindi natanggap ang refund. Suriin muna ang padala bago magtala ng pagwawasto.",
  "Refund not received": "Hindi natanggap ang refund",
  "What needs checking?": "Ano ang kailangang suriin?",
  "Check your account first. The refund will stay open for the business to review.": "Suriin muna ang iyong account. Mananatiling bukas ang refund para masuri ng negosyo.",
  "Confirm refund transfer": "Kumpirmahin ang pagpapadala ng refund",
  "Confirm transferred": "Kumpirmahing naipadala na",
  "Star ratings do not require a transaction. Written reviews require a completed transaction.": "Hindi kailangan ng transaksiyon para sa mga bituin. Kailangan ng nakumpletong transaksiyon para sa nakasulat na pagsusuri.",
  "Ratings": "Mga marka",
  "Open Vici AI": "Buksan ang Vici AI",
  "Search places": "Maghanap ng lugar",
  "Hide floating AI": "Itago ang lumulutang na AI",
  "Restore floating AI": "Ibalik ang lumulutang na AI",
  "Move floating AI": "Ilipat ang lumulutang na AI",
  "Ownership transfers": "Mga paglilipat ng pagmamay-ari",
  "Ownership transfer": "Paglilipat ng pagmamay-ari",
  "Enter the email of a verified business account. Your password confirms this request. Ownership changes only after the recipient accepts.": "Ilagay ang adres ng elektronikong liham ng isang napatunayang account ng negosyo. Kumpirmahin gamit ang iyong kontrasenyas. Magbabago lamang ang may-ari kapag tinanggap ng tatanggap.",
  "New owner email": "Adres ng elektronikong liham ng bagong may-ari",
  "Your current password": "Iyong kasalukuyang kontrasenyas",
  "Confirm and request transfer": "Kumpirmahin at hilingin ang paglilipat",
  "Transfer requested. The new owner must accept before ownership changes.": "Naipadala ang kahilingan. Kailangang tanggapin ito ng bagong may-ari bago magbago ang pagmamay-ari.",
  "Loading transfers…": "Inihahanda ang mga paglilipat…",
  "Choose a pending transfer to review.": "Pumili ng nakabinbing paglilipat na susuriin.",
  "No ownership transfers.": "Walang paglilipat ng pagmamay-ari.",
  "From": "Mula kay",
  "To": "Para kay",
  "Accept ownership": "Tanggapin ang pagmamay-ari",
  "Decline transfer": "Tanggihan ang paglilipat",
  "Cancel transfer": "Kanselahin ang paglilipat",
  "Accept this establishment and become its owner?": "Tanggapin ang establisimyentong ito at maging may-ari nito?",
  "Decline this ownership transfer?": "Tanggihan ang paglilipat ng pagmamay-ari?",
  "Cancel this ownership transfer?": "Kanselahin ang paglilipat ng pagmamay-ari?",
  "This QR expired. Scan the current QR on the store screen.": "Paso na ang kodigong ito. Basahin ang kasalukuyang kodigo sa pahina ng tindahan.",
  "This QR belongs to another establishment.": "Para sa ibang establisimyento ang kodigong ito.",
  "This is not a Vicinify Suki QR.": "Hindi ito kodigo ng Suki Kard ng Vicinify.",
  "Transaction record retained after account deletion.": "Pinanatili ang tala ng transaksiyon matapos burahin ang account.",
  "Deleted account": "Naburang account",
  "Closed establishment": "Nagsarang establisimyento",
  "Confirm your current password before requesting an ownership transfer.": "Kumpirmahin ang kasalukuyang kontrasenyas bago humiling ng paglilipat ng pagmamay-ari.",
  "Choose another verified business account.": "Pumili ng ibang napatunayang account ng negosyo.",
  "Complete transactions and refunds before transferring this establishment.": "Tapusin muna ang mga transaksiyon at pagsasauli ng bayad bago ilipat ang pagmamay-ari.",
  "Transfer ownership first, or explicitly choose to close your establishments.": "Ilipat muna ang pagmamay-ari o piliing isara ang iyong mga establisimyento.",
  "Enter your password.": "Ilagay ang iyong kontrasenyas.",
  "QR changes every 30s · 1s left": "Nagbabago ang kodigo tuwing 30 segundo · 1 segundo ang natitira",
  "QR changes every 30s · 2s left": "Nagbabago ang kodigo tuwing 30 segundo · 2 segundo ang natitira",
  "QR changes every 30s · 3s left": "Nagbabago ang kodigo tuwing 30 segundo · 3 segundo ang natitira",
  "QR changes every 30s · 4s left": "Nagbabago ang kodigo tuwing 30 segundo · 4 segundo ang natitira",
  "QR changes every 30s · 5s left": "Nagbabago ang kodigo tuwing 30 segundo · 5 segundo ang natitira",
  "QR changes every 30s · 6s left": "Nagbabago ang kodigo tuwing 30 segundo · 6 segundo ang natitira",
  "QR changes every 30s · 7s left": "Nagbabago ang kodigo tuwing 30 segundo · 7 segundo ang natitira",
  "QR changes every 30s · 8s left": "Nagbabago ang kodigo tuwing 30 segundo · 8 segundo ang natitira",
  "QR changes every 30s · 9s left": "Nagbabago ang kodigo tuwing 30 segundo · 9 segundo ang natitira",
  "QR changes every 30s · 10s left": "Nagbabago ang kodigo tuwing 30 segundo · 10 segundo ang natitira",
  "QR changes every 30s · 11s left": "Nagbabago ang kodigo tuwing 30 segundo · 11 segundo ang natitira",
  "QR changes every 30s · 12s left": "Nagbabago ang kodigo tuwing 30 segundo · 12 segundo ang natitira",
  "QR changes every 30s · 13s left": "Nagbabago ang kodigo tuwing 30 segundo · 13 segundo ang natitira",
  "QR changes every 30s · 14s left": "Nagbabago ang kodigo tuwing 30 segundo · 14 segundo ang natitira",
  "QR changes every 30s · 15s left": "Nagbabago ang kodigo tuwing 30 segundo · 15 segundo ang natitira",
  "QR changes every 30s · 16s left": "Nagbabago ang kodigo tuwing 30 segundo · 16 segundo ang natitira",
  "QR changes every 30s · 17s left": "Nagbabago ang kodigo tuwing 30 segundo · 17 segundo ang natitira",
  "QR changes every 30s · 18s left": "Nagbabago ang kodigo tuwing 30 segundo · 18 segundo ang natitira",
  "QR changes every 30s · 19s left": "Nagbabago ang kodigo tuwing 30 segundo · 19 segundo ang natitira",
  "QR changes every 30s · 20s left": "Nagbabago ang kodigo tuwing 30 segundo · 20 segundo ang natitira",
  "QR changes every 30s · 21s left": "Nagbabago ang kodigo tuwing 30 segundo · 21 segundo ang natitira",
  "QR changes every 30s · 22s left": "Nagbabago ang kodigo tuwing 30 segundo · 22 segundo ang natitira",
  "QR changes every 30s · 23s left": "Nagbabago ang kodigo tuwing 30 segundo · 23 segundo ang natitira",
  "QR changes every 30s · 24s left": "Nagbabago ang kodigo tuwing 30 segundo · 24 segundo ang natitira",
  "QR changes every 30s · 25s left": "Nagbabago ang kodigo tuwing 30 segundo · 25 segundo ang natitira",
  "QR changes every 30s · 26s left": "Nagbabago ang kodigo tuwing 30 segundo · 26 segundo ang natitira",
  "QR changes every 30s · 27s left": "Nagbabago ang kodigo tuwing 30 segundo · 27 segundo ang natitira",
  "QR changes every 30s · 28s left": "Nagbabago ang kodigo tuwing 30 segundo · 28 segundo ang natitira",
  "QR changes every 30s · 29s left": "Nagbabago ang kodigo tuwing 30 segundo · 29 segundo ang natitira",
  "QR changes every 30s · 30s left": "Nagbabago ang kodigo tuwing 30 segundo · 30 segundo ang natitira",
  "Your login, profiles and personal data will be removed. Essential shared transaction history and anonymous ratings remain. Other participants retain their own transaction records. This cannot be undone.": "Buburahin ang iyong pagpasok sa account, pagkakakilanlan, at personal na datos. Mananatili ang mahahalagang tala ng transaksiyon at mga markang walang pagkakakilanlan. Mananatili rin ang sariling tala ng ibang kalahok. Hindi na ito maibabalik.",
  "Could not verify your password. Please try again.": "Hindi makumpirma ang iyong kontrasenyas. Pakisubukan muli.",
  "This protected administrator account cannot be deleted through self-service.": "Hindi maaaring burahin sa sariling pamamaraan ang protektadong account ng tagapangasiwang ito.",
  "This establishment is closed. Open your transaction history instead.": "Sarado na ang establisimyentong ito. Buksan ang iyong tala ng transaksiyon.",
  "Camera scanning requires a supported browser with HTTPS.": "Kailangan ng angkop na pang-browse na may HTTPS upang magamit ang kamera.",
  "Enter the new owner email.": "Ilagay ang adres ng elektronikong liham ng bagong may-ari.",
  "Only the current owner can transfer this establishment.": "Ang kasalukuyang may-ari lamang ang maaaring maglipat ng pagmamay-ari.",
  "The recipient must have a registered, verified business account.": "Kailangang may nakarehistro at napatunayang account ng negosyo ang tatanggap.",
  "Ownership or account status changed.": "Nagbago ang pagmamay-ari o kalagayan ng account.",
  "A transfer is already pending. Cancel it before choosing another recipient.": "May nakabinbin nang paglilipat. Kanselahin ito bago pumili ng ibang tatanggap.",
  "This transfer action is unavailable.": "Hindi magagamit ang hakbang na ito sa paglilipat.",
  "Wait for the current transfer attempt to finish before cancelling.": "Hintaying matapos ang kasalukuyang pagtatangkang maglipat bago magkansela.",
  "A business account is required.": "Kailangan ng account ng negosyo.",
  "This transfer is unavailable.": "Hindi magagamit ang paglilipat na ito.",
  "The transfer is still processing. Wait a minute before retrying.": "Pinoproseso pa ang paglilipat. Maghintay ng isang minuto bago muling subukan.",
  "Transfer status changed. Retry or contact support.": "Nagbago ang kalagayan ng paglilipat. Subukan muli o makipag-ugnayan sa tagapangasiwa.",
  "Transfer paused. The recipient can retry accepting it.": "Nahinto ang paglilipat. Maaaring subukang tanggapin itong muli ng tatanggap.",
  "Cleanup is still running. Wait a minute, then resume.": "Tumatakbo pa ang paglilinis. Maghintay ng isang minuto bago magpatuloy.",
  "Invalid deletion session.": "Hindi wasto ang pahintulot sa pagbura.",
  "Sign in again before deleting your account.": "Pumasok muli sa account bago ito burahin.",
  "Sign in again before resuming deletion.": "Pumasok muli sa account bago ipagpatuloy ang pagbura.",
  "Deletion already started. Resume the cleanup.": "Nagsimula na ang pagbura. Ipagpatuloy ang paglilinis.",
  "Resolve account obligations before deletion.": "Ayusin muna ang mga pananagutan ng account bago ito burahin.",
  "An obligation changed. Resolve it before deleting.": "May nagbagong pananagutan. Ayusin muna ito bago magbura.",
  "Account cleanup paused. Your deletion session is saved. Try resuming.": "Nahinto ang paglilinis ng account. Naka-save ang pahintulot sa pagbura. Subukang magpatuloy.",
  "Sign in before deleting your account.": "Pumasok muna sa account bago ito burahin.",
  "Deletion session is missing. Sign in again to resume.": "Nawawala ang pahintulot sa pagbura. Pumasok muli sa account upang magpatuloy.",
  "Too many requests. Please wait a minute and try again.": "Masyadong maraming kahilingan. Maghintay ng isang minuto at subukan muli."
};

    let languageFallback='en';
    function readLanguage(){try{return localStorage.getItem('vicinify_lang')||languageFallback;}catch{return languageFallback;}}
    function saveLanguage(value){languageFallback=value==='ph'||value==='tl'?'ph':'en';try{localStorage.setItem('vicinify_lang',languageFallback);}catch{}return languageFallback;}
    const textSources=new WeakMap(), attributeSources=new WeakMap();
    const protectedContent='script,style,code,pre,textarea,[contenteditable=true],[translate=no],[data-no-translate],.notranslate,#accountName,#accountInitials,#settingsAccountEmail,.buzz-feed-body,.buzz-feed-name,.buzz-comment-text,.buzz-comment-name,.chat-message-text,.chat-message-sender,.chat-sender-avatar,#listPreviewTitle,.list-preview-description,.list-preview-summary dd,.list-menu-post-caption p,.list-menu-detail p,.list-preview-review p,.list-preview-review-person strong,.place-list-address,.place-list-card h3,.place-list-card h4,.ticket-who h4,.ticket-place,.ticket-detail-list dd,.place-description-text,.place-menu-body,.place-review-comment,.place-menu-author strong,.suki-name,#bookingStoreChip,#chatTitle,#chatModalTitle,#chatModalAvatar,.business-chat-place';
    const normalizeText=value=>String(value??'').replace(/\s+/g,' ').trim();
    const caseKeys=new Map(Object.keys(phDictionary).map(key=>[key.toLowerCase(),key]));
    const translatedPrefixes=Object.keys(phDictionary).filter(key=>key.endsWith(':'));
    function tagalogText(value){
        const key=normalizeText(value),exact=Object.hasOwn(phDictionary,key)?key:caseKeys.get(key.toLowerCase());
        if(exact){const result=phDictionary[exact];return key===key.toUpperCase()&&/[A-Z]/.test(key)?result.toUpperCase():result;}
        let match;
        if((match=key.match(/^Updated (\d+) days? ago$/i)))return `Nabago ${match[1]} araw ang nakalipas`;
        if((match=key.match(/^(\d+) (minute|hour|day|week|month)s? ago$/i)))return `${match[1]} ${({minute:'minuto',hour:'oras',day:'araw',week:'linggo',month:'buwan'})[match[2].toLowerCase()]} ang nakalipas`;
        if((match=key.match(/^(\d+) (post|review|stamp|filter)s?( applied)?$/i)))return `${match[1]} ${({post:'paskil',review:'pagsusuri',stamp:'tatak',filter:'sala'})[match[2].toLowerCase()]}${match[3]?' ang ginagamit':''}`;
        if((match=key.match(/^(Navigating to|Searching for|Sending to) (.+)$/)))return `${({'Navigating to':'Papunta sa','Searching for':'Hinahanap ang','Sending to':'Ipapadala kay'})[match[1]]} ${match[2]}`;
        if((match=key.match(/^(\d+(?:\.\d+)? km)\s*[·•]\s*about (.+)$/)))return `${match[1]} · humigit-kumulang ${match[2].replace(/\bmin\b/g,'minuto').replace(/\bhr\b/g,'oras')}`;
        if((match=key.match(/^Showing (\d+) of (\d+)(.*)$/)))return `Ipinapakita ang ${match[1]} sa ${match[2]}${match[3]}`;
        if((match=key.match(/^Address detected: (.+)$/)))return `Nahanap na tirahan: ${match[1]}`;
        if(key==='You have arrived at your destination.')return 'Nakarating ka na sa iyong destinasyon.';
        if(key==='Voice guidance on.')return 'Bukas na ang gabay na pasalita.';
        if((match=key.match(/^Starting navigation\. First, (.+)\.$/i)))return `Sinisimulan ang paglalakbay. Una, ${tagalogText(match[1])}.`;
        if((match=key.match(/^In (\d+(?:\.\d+)?) (meters?|kilometers?), (.+)$/i)))return `Sa ${match[1]} ${match[2].toLowerCase().startsWith('kilo')?'kilometro':'metro'}, ${tagalogText(match[3])}`;
        if((match=key.match(/^(.+) now[.]?$/i)))return `${tagalogText(match[1])} ngayon`;
        if((match=key.match(/^(Turn|Keep|Bear) (left|right)(?: (?:onto|on|towards) (.+))?[.]?$/i)))return `${match[1].toLowerCase()==='turn'?'Lumiko':'Manatili'} sa ${match[2].toLowerCase()==='left'?'kaliwa':'kanan'}${match[3]?' patungo sa '+match[3]:''}`;
        if((match=key.match(/^Continue(?: straight)?(?: (?:onto|on) (.+))?[.]?$/i)))return `Magpatuloy nang diretso${match[1]?' sa '+match[1]:''}`;
        if((match=key.match(/^Head (north|south|east|west|northeast|northwest|southeast|southwest)(?: on (.+))?[.]?$/i)))return `Tumungo sa ${{north:'hilaga',south:'timog',east:'silangan',west:'kanluran',northeast:'hilagang-silangan',northwest:'hilagang-kanluran',southeast:'timog-silangan',southwest:'timog-kanluran'}[match[1].toLowerCase()]}${match[2]?' sa '+match[2]:''}`;

        for(const prefix of translatedPrefixes){
            if(key.startsWith(prefix+' '))return phDictionary[prefix]+' '+key.slice(prefix.length).trim();
        }
        return value;
    }
    function translateDOM(lang = readLanguage(), scope = document.body) {
        if(!scope)return;
        const elements=[];
        if(scope.nodeType===1)elements.push(scope);
        if(scope.querySelectorAll)elements.push(...scope.querySelectorAll('[placeholder],[title],[aria-label],[data-i18n-placeholder]'));
        for(const el of elements){
            if(el.closest?.(protectedContent)&&!el.matches('textarea'))continue;
            const saved=attributeSources.get(el)||{};
            for(const attr of ['placeholder','title','aria-label']){
                if(!el.hasAttribute(attr))continue;
                const current=el.getAttribute(attr),record=saved[attr];
                const source=attr==='placeholder'&&el.hasAttribute('data-i18n-placeholder')?el.getAttribute('data-i18n-placeholder'):record&&current===record.output?record.source:current;
                const output=lang==='ph'?tagalogText(source):source;
                saved[attr]={source,output};if(output!==current)el.setAttribute(attr,output);
            }
            attributeSources.set(el,saved);
        }
        function translateNode(node){
            const parent=node.parentElement;
            if(!parent||!node.textContent.trim()||(parent.closest(protectedContent)&&!parent.hasAttribute('data-i18n')))return;
            const current=node.textContent,record=textSources.get(node);
            const explicit=parent.children.length===0?parent.getAttribute('data-i18n'):null;
            const source=explicit||(record&&current===record.output?record.source:current);
            let translated=lang==='ph'?tagalogText(source):source;
            if(lang==='ph'&&parent.matches('.navText'))translated=({'Admin Hub':'Tagapangasiwa','Business Hub':'Negosyo','My Activity':'Mga gawain','Settings':'Pagpipilian'})[source.trim()]||translated;
            const output=translated===source?source:source.match(/^\s*/)[0]+translated.trim()+source.match(/\s*$/)[0];
            textSources.set(node,{source,output});if(current!==output)node.textContent=output;
        }
        if(scope.nodeType===3)translateNode(scope);
        else{const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))translateNode(node);}
        document.documentElement.lang = lang === 'ph' ? 'tl' : 'en';
        document.body.dataset.lang = lang;
    }

    function setup() {
        const currentLang = readLanguage();
        const selector = document.getElementById('langSelector');
        
        if (selector) {
            selector.value = currentLang;
            selector.addEventListener('change', (e) => {
                saveLanguage(e.target.value);
                translateDOM(e.target.value);
                window.dispatchEvent(new CustomEvent("vicinify:languagechange", { detail: { lang: e.target.value } }));
            });
        }

        translateDOM(currentLang);
        let pending=false;const dirty=new Set();
        const options={childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label','data-i18n','data-i18n-placeholder']};
        const observer=new MutationObserver(records=>{
            for(const record of records){
                if(record.type==='childList')record.addedNodes.forEach(node=>dirty.add(node));
                else dirty.add(record.target);
            }
            if(pending||!dirty.size)return;pending=true;
            setTimeout(()=>{
                observer.disconnect();
                try{for(const node of dirty){if(node.isConnected)translateDOM(undefined,node);}}
                finally{dirty.clear();pending=false;observer.observe(document.body,options);}
            },50);
        });
        observer.observe(document.body,options);
    }

    function init() {
        // 🔥 BULLETPROOF TIMING: I-check kung ready na ang pahina 🔥
        if (document.readyState === 'loading') {
            document.addEventListener("DOMContentLoaded", setup);
        } else {
            setup();
        }
    }

    function setLanguage(lang) {
        lang=saveLanguage(lang);
        const selector = document.getElementById('langSelector');
        if (selector) selector.value = lang;
        translateDOM(lang);
        window.dispatchEvent(new CustomEvent("vicinify:languagechange", { detail: { lang } }));
    }

    function getLanguage() {
        return readLanguage();
    }

    function translateKey(key){ return getLanguage()==='ph'?tagalogText(key):key; }
    return { init, translateDOM, setLanguage, getLanguage, translateKey };
})();

// Patakbuhin agad bago pa mag-load ang buong screen!
window.LangManager.init();
window.t = (key) => { try { const lang = window.LangManager?.getLanguage?.() || localStorage.getItem('vicinify_lang') || 'en'; return lang === 'ph' ? (window.LangManager?.translateKey?.(key) || key) : key; } catch(e){ return key; } };
// Re-translate dynamic pages after navigation (dynamic HTML is rendered on page switch)
document.addEventListener('click', (e) => { if (e.target.closest('[data-goto], .nav-item, .cust-tab, .biz-tab')) setTimeout(() => window.LangManager?.translateDOM?.(), 350); });

// =========================================
// MODERN TOAST SYSTEM (v17) — replaces every native alert()
// One engine: window.vicinifyToast(msg, type). alert() and
// showToast() both route here, so all ~130 old call sites get
// the new design without rewriting each one.
// Types: success | error | warning | info (auto-detected for alert())
// =========================================
window.__nativeAlert = window.__nativeAlert || window.alert.bind(window);
function vicinifyCleanMessage(msg) {
    const msgStr = String(msg ?? "");
    const low = msgStr.toLowerCase();
    let clean = msgStr.replace('Firebase Error: Firebase: ', '').replace('Firebase: ', '').replace(/\(auth\/.*\)\./g, '').replace(/[🎉🎊🥳]/gu,'').trim();
    if (low.includes('email-already-in-use') || low.includes('already in use')) clean = "This email is already in use. Please try another one.";
    else if (low.includes('wrong-password') || low.includes('invalid-credential')) clean = "Invalid email or password. Please try again.";
    else if (low.includes('user-not-found')) clean = "No account registered with this email address.";
    else if (low.includes('too-many-requests')) clean = "Too many failed attempts. Please try again later.";
    else if (low.includes('network-request-failed') || low.includes('network error')) clean = "Network error. Please check your internet connection.";
    return clean || "Done.";
}
function vicinifyDetectType(msg, forced) {
    if (forced && ['success','error','warning','info'].includes(forced)) return forced;
    const low = String(msg ?? "").toLowerCase();
    if (/(error|failed|unable|invalid|denied|wrong|not allowed|does not exist|no longer exists|missing)/.test(low)) return 'error';
    if (/(please (enter|select|fill|choose|log|check|add)|required|at least|must |wait |limit reached|maximum|characters|words|verify|offline)/.test(low)) return 'warning';
    if (/(success|sent|saved|created|updated|removed|deleted|approved|confirmed|submitted|done|thank)/.test(low)) return 'success';
    return 'info';
}

// Offline / back-online notice (slow-internet UX). Toast engine is defined below.
window.addEventListener("offline", () => { try { window.vicinifyToast && window.vicinifyToast("You are offline. Some features need internet.", "warning"); } catch (e) {} });
window.addEventListener("online", () => { try { window.vicinifyToast && window.vicinifyToast("Back online.", "success"); } catch (e) {} });

window.vicinifyToast = function(msg, type) {
    const text = vicinifyCleanMessage(msg);
    const kind = vicinifyDetectType(msg, type === 'auto' ? undefined : type);
    let stack = document.getElementById('v-toast-stack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'v-toast-stack';
        stack.setAttribute('role','region'); stack.setAttribute('aria-label','Notifications');
        document.body.appendChild(stack);
    }
    const toastKey=kind+':'+text;
    const existing=[...stack.children].find(item=>item.dataset.toastKey===toastKey&&!item.classList.contains('out'));
    if(existing)return existing;
    while (stack.children.length >= 2) stack.firstChild.remove();
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.5l5 5L19.5 6.5"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.5V14m0 4.2v.3"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path stroke-linecap="round" d="M12 10.5V18m0-11.5v.3"/></svg>'
    };
    const titles = { success: 'Success', error: 'Something went wrong', warning: 'Heads up', info: 'Info' };
    const el = document.createElement('div');
    el.className = 'v-toast v-toast-' + kind;
    el.dataset.toastKey=toastKey;
    el.setAttribute('role',kind==='error'?'alert':'status');
    const icon = document.createElement('span'); icon.className = 'v-toast-icon'; icon.innerHTML = icons[kind] || icons.info;
    const body = document.createElement('span'); body.className = 'v-toast-body';
    const titleEl = document.createElement('b'); titleEl.className = 'v-toast-title'; titleEl.textContent = titles[kind] || 'Info';
    const textEl = document.createElement('span'); textEl.className = 'v-toast-text'; textEl.textContent = text;
    body.append(titleEl, textEl);
    const close = document.createElement('button'); close.className = 'v-toast-close'; close.type = 'button'; close.setAttribute('aria-label', 'Dismiss');
    close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>';
    const bar = document.createElement('span'); bar.className = 'v-toast-bar';
    el.append(icon, body, close, bar);
    stack.appendChild(el);
    window.LangManager?.translateDOM?.(undefined,el);
    const duration = Math.min(8500, Math.max(3600, 2200 + text.length * 45));
    bar.style.animationDuration = duration + 'ms';
    let gone = false, timer;
    const dismiss = () => { if (gone) return; gone = true; clearTimeout(timer); el.classList.add('out'); setTimeout(() => el.remove(), 260); };
    close.onclick = dismiss;
    el.onclick = (e) => { if (e.target === el || e.target === body) dismiss(); };
    timer=setTimeout(dismiss, duration);
    return el;
};
window.showToast = function(msg, type) { return window.vicinifyToast(msg, type || 'info'); };
window.alert = function(msg) { return window.vicinifyToast(msg, 'auto'); };

// ---------- Firestore quota guard (Spark free plan) ----------
// Any Firestore error whose code/message indicates quota exhaustion must
// surface a user-visible message — never a silent spinner. Returns true
// when the error was a quota error (and the toast was shown).
let _quotaToastAt = 0;
window.isFirestoreQuotaError = function(err) {
    if (!err) return false;
    const code = String(err.code || "").toLowerCase();
    const msg = String(err.message || err || "").toLowerCase();
    return code === "resource-exhausted" ||
        msg.indexOf("quota") !== -1 ||
        msg.indexOf("resource-exhausted") !== -1 ||
        msg.indexOf("resource exhausted") !== -1;
};
window.handleFirestoreError = function(err, fallbackMsg) {
    if (window.isFirestoreQuotaError(err)) {
        const now = Date.now();
        if (now - _quotaToastAt > 60000 && window.showToast) {
            _quotaToastAt = now;
            window.showToast("Free database quota is exhausted for today. Please try again later.", "error");
        }
        return true;
    }
    if (fallbackMsg && window.showToast) window.showToast(fallbackMsg, "error");
    return false;
};

window.vConfirm = function(title, message, confirmBtnText = "Confirm", isDanger = false) {
    return new Promise((resolve) => {
        const modalId = "vConfirm_" + Date.now() + '_' + (window.__vConfirmSequence = (window.__vConfirmSequence || 0) + 1);
        const previousFocus=document.activeElement;
        window.lockBodyScroll(true);
        // Native dialog goes into the browser top layer. A positioned <div>
        // cannot appear above another <dialog>. Support older browsers with
        // the previous fixed-overlay fallback.
        const nativeConfirm = typeof HTMLDialogElement !== 'undefined' &&
            typeof HTMLDialogElement.prototype.showModal === 'function';
        const tag = nativeConfirm ? 'dialog' : 'div';
        const btnClass = isDanger ? "danger" : "primary";
        const btnStyle = isDanger ? "background: #ef4444; color: white; border: none; padding: 12px 18px; border-radius: 10px; font-weight: 600; cursor: pointer;" : "background: #0f172a; color: white; border: none; padding: 12px 18px; border-radius: 10px; font-weight: 600; cursor: pointer;";
        
        const modalHtml = `
            <${tag} id="${modalId}" class="vici-confirm-layer" role="alertdialog" aria-modal="true" aria-labelledby="${modalId}_title" aria-describedby="${modalId}_body" style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 99999; width:100%; height:100dvh; max-width:none; max-height:none; margin:0; padding:16px; border:0; background:transparent; color:inherit; box-sizing:border-box;">
                <div class="modalBackdrop" style="position: absolute; inset: 0; background: rgba(0,0,0,0.5);"></div>
                <div class="modalBox" style="position: relative; width: 90%; max-width: 400px; background:var(--ui-surface); border-radius: 18px; padding: 24px; z-index: 1; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
                    <h3 id="${modalId}_title" data-vconfirm-title style="margin-top: 0; font-size: 18px; color:var(--ui-ink); margin-bottom: 12px;"></h3>
                    <p id="${modalId}_body" data-vconfirm-message style="font-size: 14px; color:var(--ui-muted); margin-bottom: 24px; line-height: 1.5; white-space: pre-line;"></p>
                    <div style="display: flex; gap: 12px;">
                        <button id="cancelBtn_${modalId}" style="flex: 1; background: #f1f5f9; color:var(--ui-muted); border: none; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer;">Cancel</button>
                        <button id="confirmBtn_${modalId}" style="flex: 1; ${btnStyle}"></button>
                    </div>
                </div>
            </${tag}>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modalEl = document.getElementById(modalId);
        modalEl.querySelector("[data-vconfirm-title]").textContent = String(title || "Confirm");
        modalEl.querySelector("[data-vconfirm-message]").textContent = String(message || "");
        document.getElementById(`confirmBtn_${modalId}`).textContent = String(confirmBtnText || "Confirm");
        document.getElementById(`confirmBtn_${modalId}`).dataset.danger = String(isDanger);
        
        let finished=false;
        const cleanup = (result) => {
            if(finished)return;finished=true;
            document.removeEventListener('keydown',onKey,true);
            window.lockBodyScroll(false);
            if(nativeConfirm && modalEl.open) modalEl.close();
            modalEl.remove();
            if(previousFocus?.isConnected)previousFocus.focus?.();
            resolve(result);
        };
        const onKey=event=>{
            if([...document.querySelectorAll('[id^="vConfirm_"][role="alertdialog"]')].at(-1)!==modalEl)return;
            if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();cleanup(false);}
            if(event.key==='Tab'){
                const buttons=[...modalEl.querySelectorAll('button')];
                if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();buttons.at(-1).focus();}
                else if(!event.shiftKey&&document.activeElement===buttons.at(-1)){event.preventDefault();buttons[0].focus();}
            }
        };
        document.addEventListener('keydown',onKey,true);
        if(nativeConfirm){
            // Escape triggers a native cancel event: always treat it as Cancel.
            modalEl.addEventListener('cancel', event=>{event.preventDefault();cleanup(false);});
            try { modalEl.showModal(); }
            catch(error){
                // Never leave an invisible/stuck confirmation if modal setup fails.
                console.error('[vConfirm] Could not open confirmation dialog:',error);
                cleanup(false);
                return;
            }
        }
        document.getElementById(`cancelBtn_${modalId}`).focus();

        document.getElementById(`cancelBtn_${modalId}`).onclick = () => cleanup(false);
        document.getElementById(`confirmBtn_${modalId}`).onclick = () => cleanup(true);
        modalEl.querySelector('.modalBackdrop').onclick = () => cleanup(false);
    });
};

// ---------- FIREBASE CONFIGURATION ----------
const firebaseConfig = {
    apiKey: "AIzaSyBaEwj_D18fXea9OqzCcF8Q9CH_rVZLoJA",
    authDomain: "vicinify-c9828.firebaseapp.com",
    projectId: "vicinify-c9828",
    storageBucket: "vicinify-c9828.firebasestorage.app",
    messagingSenderId: "198267160268",
    appId: "1:198267160268:web:1604e14237653546836469"
};

const vicinifyFirebaseApp = window.VicinifyDemoSwitch?.initializeFirebaseApp(firebaseConfig) || firebase.initializeApp(firebaseConfig);
window.auth = firebase.auth(vicinifyFirebaseApp);
window.db = firebase.firestore(vicinifyFirebaseApp);
window.VicinifyDemoSwitch?.init(window.auth);

// Local cache first: reloads and repeat visits read from this device's cache
// instead of re-billing every document from the server (Spark quota saver).
// NOTE (v49): multi-tab cache sync (synchronizeTabs:true) crashed the Firestore
// client with "INTERNAL ASSERTION FAILED: Unexpected state" when several app
// tabs were open at once — writes then hung forever on "Posting...".
// Single-tab cache only: the first tab gets the cache, other tabs fall back
// to live mode via the catch below. The app works either way.
try {
    window.db.enablePersistence().catch(() => {});
} catch (e) { /* cache unavailable (private mode etc.) — app still works without it */ }
window.storage = firebase.storage(vicinifyFirebaseApp);

// v53BH: Debounced lucide — scanning entire DOM 66x is a major lag source
// Queues icon renders and batches them into one DOM scan per frame
window.debouncedIcons = (() => {
    let scheduled = false;
    let root = null;
    return function(scope) {
        if (scope && scope !== document) root = scope;
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            try {
                const target = root || document;
                root = null;
                if (window.lucide) {
                    if (target === document) window.lucide.createIcons();
                    else window.lucide.createIcons({ root: target });
                }
            } catch (e) {}
        });
    };
})();

// v53BB — Global loading overlay (reference-counted) + navigation sounds
window.GlobalLoader = (() => {
    let count = 0;
    let el = null;
    function ensure() {
        if (!el) {
            el = document.createElement("div");
            el.id = "globalLoader";
            el.innerHTML = `<div class="loader-box"><div class="spinner"></div><div class="loader-text" id="globalLoaderText">Loading...</div></div>`;
            document.body.appendChild(el);
        }
        return el;
    }
    return {
        show(text) {
            count++;
            const e = ensure();
            if (text) { const t = document.getElementById("globalLoaderText"); if (t) t.textContent = text; }
            e.classList.add("show");
        },
        hide() {
            count = Math.max(0, count - 1);
            if (count === 0 && el) el.classList.remove("show");
        },
        // Auto-wrap a promise: shows loader until it settles
        wrap(promise, text) {
            this.show(text);
            return Promise.resolve(promise).finally(() => this.hide());
        }
    };
})();

// v53BB — Subtle navigation sounds (Web Audio, no files needed)
window.NavSound = (() => {
    let ctx = null;
    let enabled = true;
    function getCtx() {
        if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
        if (ctx && ctx.state === "suspended") ctx.resume();
        return ctx;
    }
    function beep(freq, dur, vol) {
        if (!enabled) return;
        const ac = getCtx();
        if (!ac) return;
        try {
            const o = ac.createOscillator();
            const g = ac.createGain();
            o.type = "sine";
            o.frequency.value = freq;
            g.gain.setValueAtTime(vol || 0.08, ac.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
            o.connect(g); g.connect(ac.destination);
            o.start(); o.stop(ac.currentTime + dur);
        } catch (e) {}
    }
    return {
        // Soft click for navigation
        nav() { beep(660, 0.07); },
        // Slightly higher for actions (send, submit)
        action() { beep(880, 0.09); },
        // Success chime
        success() { beep(660, 0.08); setTimeout(() => beep(990, 0.1), 80); },
        toggle() { enabled = !enabled; return enabled; },
        get enabled() { return enabled; }
    };
})();


// ---------- Storage Keys ----------
const STORAGE = {
    ACCEPTED: "vicinify_places_accepted",
    PENDING: "vicinify_places_pending",
    BUZZ: "vicinify_buzz_posts",
    SETTINGS: "vicinify_settings"
};

// ---------- Helpers ----------
function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}
function uid(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function formatDateTime(ts) {
    if (!ts) return "Just now";
    const d = typeof ts === 'object' && ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[s]));
}

function safeImageUrl(rawUrl) {
    const value = String(rawUrl || "").trim();
    if (!value || /[\u0000-\u001f"'<>\\]/.test(value)) return "";

    if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) {
        return value.replace(/\s/g, "");
    }

    if (value.startsWith("blob:")) return value;

    try {
        const parsed = new URL(value, window.location.href);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") return value;
    } catch (e) {
        if (/^(assets|images|img)\//i.test(value)) return value;
    }

    return "";
}

window.safeImageUrl = safeImageUrl;

function toViciDate(value) {
    if (!value) return null;
    if (value.toDate && typeof value.toDate === "function") return value.toDate();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getViciFreshnessStatus(place = {}) {
    const stamp = place.lastConfirmedAt || place.infoConfirmedAt || place.businessConfirmedAt || place.lastBusinessUpdateAt || place.updatedAt || place.createdAt;
    const date = toViciDate(stamp);
    const days = date ? Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000)) : null;

    if (days == null) {
        return {
            level: "unconfirmed",
            label: "Needs confirmation",
            shortLabel: "Unconfirmed",
            tone: "#ef4444",
            bg: "#fef2f2",
            border: "#fecaca",
            markerColor: "#ef4444",
            className: "freshness-unconfirmed",
            days,
            isInactive: false
        };
    }

    if (days <= 7) {
        return {
            level: "active",
            label: days === 0 ? "Updated today" : `Updated ${days} day${days === 1 ? "" : "s"} ago`,
            shortLabel: "Fresh",
            tone: "#16a34a",
            bg: "#f0fdf4",
            border: "#bbf7d0",
            markerColor: null,
            className: "freshness-active",
            days,
            isInactive: false
        };
    }

    if (days <= 14) {
        return {
            level: "due",
            label: "Due for weekly check",
            shortLabel: "Due soon",
            tone: "#b45309",
            bg: "#fffbeb",
            border: "#fde68a",
            markerColor: "#f59e0b",
            className: "freshness-due",
            days,
            isInactive: false
        };
    }

    if (days <= 30) {
        return {
            level: "needs_update",
            label: "Info may need update",
            shortLabel: "Needs update",
            tone: "#c2410c",
            bg: "#fff7ed",
            border: "#fed7aa",
            markerColor: "#f97316",
            className: "freshness-needs-update",
            days,
            isInactive: false
        };
    }

    if (days <= 60) {
        return {
            level: "unconfirmed",
            label: "Info is unconfirmed",
            shortLabel: "Unconfirmed",
            tone: "#dc2626",
            bg: "#fef2f2",
            border: "#fecaca",
            markerColor: "#ef4444",
            className: "freshness-unconfirmed",
            days,
            isInactive: false
        };
    }

    return {
        level: "inactive",
        label: "Inactive / unconfirmed",
        shortLabel: "Inactive",
        tone: "#64748b",
        bg: "#f1f5f9",
        border: "#cbd5e1",
        markerColor: "#64748b",
        className: "freshness-inactive",
        days,
        isInactive: true
    };
}

window.toViciDate = toViciDate;
window.getViciFreshnessStatus = getViciFreshnessStatus;


/* v53W — Global modal scroll lock: background page cannot scroll while any modal is open.
   Reference-counted so stacked modals (open over open) unlock only when all are closed. */
window.__viciModalLocks = 0;
window.lockBodyScroll = function (on) {
    window.__viciModalLocks = Math.max(0, window.__viciModalLocks + (on ? 1 : -1));
    const locked = window.__viciModalLocks > 0;
    document.documentElement.classList.toggle("vici-modal-lock", locked);
    document.body.classList.toggle("vici-modal-lock", locked);
};

const AppState = {
    user: null,
    userProfile: null,
    userLocation: { lat: null, lng: null },
    radius: 300,
    activeCat: "all",
    activePage: "page-login",
    searchQuery: ""
};


function applyViciPageScrollState(pageId) {
    const isMapPage = pageId === "page-map";
    const html = document.documentElement;
    const body = document.body;
    if (!body) return;

    html.classList.toggle("vici-map-lock", isMapPage);
    body.classList.toggle("vici-map-lock", isMapPage);
    html.classList.toggle("map-page-lock", isMapPage);
    body.classList.toggle("map-page-lock", isMapPage);

    if (isMapPage) {
        window.scrollTo(0, 0);
        html.scrollTop = 0;
        body.scrollTop = 0;

        html.style.overflow = "hidden";
        html.style.overflowY = "hidden";
        html.style.height = "100dvh";
        html.style.maxHeight = "100dvh";
        html.style.scrollbarWidth = "none";

        body.style.overflow = "hidden";
        body.style.overflowY = "hidden";
        body.style.height = "100dvh";
        body.style.maxHeight = "100dvh";
        body.style.position = "relative";
        body.style.scrollbarWidth = "none";
    } else {
        html.style.overflow = "";
        html.style.overflowY = "";
        html.style.height = "";
        html.style.maxHeight = "";
        html.style.scrollbarWidth = "";

        body.style.overflow = "";
        body.style.overflowY = "";
        body.style.height = "";
        body.style.maxHeight = "";
        body.style.position = "";
        body.style.scrollbarWidth = "";

        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        html.scrollTop = 0;
        body.scrollTop = 0;
    }
}

window.applyViciPageScrollState = applyViciPageScrollState;

function resetViciPageScroll(pageId) {
    const html = document.documentElement;
    const body = document.body;
    const activePage = document.getElementById(pageId);
    const scrollingElement = document.scrollingElement || document.documentElement;

    try { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); } catch (e) { window.scrollTo(0, 0); }
    if (html) html.scrollTop = 0;
    if (body) body.scrollTop = 0;
    if (scrollingElement) {
        scrollingElement.scrollTop = 0;
        scrollingElement.scrollLeft = 0;
    }

    const scrollContainers = [
        ".app",
        ".settings-content",
        ".dashboard-content",
        ".admin-content",
        ".filter-content",
        "#page-biz-edit"
    ];

    scrollContainers.forEach(selector => {
        const el = document.querySelector(selector);
        if (!el) return;
        el.scrollTop = 0;
        el.scrollLeft = 0;
        el.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
    });

    document.querySelectorAll(".page").forEach(page => {
        page.scrollTop = 0;
        page.scrollLeft = 0;
    });

    activePage?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
}


// ---- Broken image guard (v13): never show the browser's broken-image placeholder (diamond-?) ----
// Any <img> that fails to load is removed; containers with data-img-fallback show their fallback instead.
document.addEventListener("error", function (e) {
    const el = e.target;
    if (el && el.tagName === "IMG") {
        el.style.display = "none";
        el.classList.add("img-broken");
        const wrap = el.closest("[data-img-fallback]");
        if (wrap) wrap.classList.add("img-fallback-on");
    }
}, true);

// ---------- Navigation ----------
// Browser history and the app's page history use the same small, in-memory route list.
// Do not persist private place/account state in URLs or localStorage.
const ViciNavigation = (() => {
    let session = Math.random().toString(36).slice(2) + Date.now().toString(36);
    let routes = [];
    let position = -1;
    let skipStudioCheck = false;
    let pendingViciReturnIndex = null;
    const stateFor = (route, index) => ({ vicinifyRoute: true, vicinifySession: session,
        vicinifyIndex: index, vicinifyPage: route.page, vicinifyPlaceId: route.placeId || null });
    const getPlaceId = page => page === 'page-place' ? (window.currentPlaceReviewId || null) : null;
    function write(route, index, replace) {
        try { window.history[replace ? 'replaceState' : 'pushState'](stateFor(route, index), '', window.location.href); }
        catch (error) { console.warn('[navigation] Browser history unavailable:', error); }
    }
    function remember(page, options = {}) {
        const route = { page, placeId: getPlaceId(page) };
        if (!routes.length || options.resetHistory) {
            if (options.resetHistory) session = Math.random().toString(36).slice(2) + Date.now().toString(36);
            routes = [route]; position = 0; pendingViciReturnIndex = null; write(route, position, true); return;
        }
        if (options.fromHistory) return;
        if (page === AppState.activePage) {
            routes[position] = route;
            write(route, position, true);
            return;
        }
        if (options.replaceHistory) {
            routes[position] = route;
            write(route, position, true);
            return;
        }
        routes = routes.slice(0, position + 1);
        routes.push(route);
        position += 1;
        write(route, position, false);
    }
    function canGoBack() { return position > 0 && window.history.state?.vicinifySession === session; }
    function goBack(fallback = 'page-map') {
        if (canGoBack()) { window.history.back(); return true; }
        skipStudioCheck = false;
        const destination = document.getElementById(fallback) ? fallback : (AppState.user ? 'page-map' : 'page-login');
        showPage(destination, { replaceHistory: true });
        return false;
    }
    function allowStudioBackOnce() { skipStudioCheck = true; }
    window.addEventListener('popstate', async event => {
        const target = event.state;
        // A stale or external browser entry must not revive pages from an old login session.
        if (!target?.vicinifyRoute || target.vicinifySession !== session ||
            !Number.isInteger(target.vicinifyIndex) ||
            target.vicinifyIndex < 0 || target.vicinifyIndex >= routes.length ||
            routes[target.vicinifyIndex]?.page !== target.vicinifyPage) {
            const fallback = AppState.user ? 'page-map' : 'page-login';
            showPage(fallback, { resetHistory: true });
            return;
        }
        if (target.vicinifyIndex === position && target.vicinifyPage === AppState.activePage) return;
        const nextPage = target.vicinifyPage;
        if ((!AppState.user && nextPage !== 'page-login') ||
            (AppState.user && nextPage === 'page-login') || !document.getElementById(nextPage)) {
            showPage(AppState.user ? 'page-map' : 'page-login', { resetHistory: true });
            return;
        }
        const oldPosition = position;
        if (AppState.activePage === 'page-suki-studio' && nextPage !== 'page-suki-studio') {
            const approved = skipStudioCheck || await window.DashboardPage?.confirmLeaveSukiStudio?.();
            skipStudioCheck = false;
            if (approved === false) {
                // Undo only this back/forward gesture; the editor and its draft remain intact.
                window.history.go(oldPosition - target.vicinifyIndex);
                return;
            }
            window.DashboardPage?.cleanupSukiStudio?.();
        } else skipStudioCheck = false;
        const shouldRestoreVici = pendingViciReturnIndex === target.vicinifyIndex &&
            AppState.activePage === 'page-place' && nextPage === 'page-map';
        // One-shot return target: never reopen AI during unrelated navigation.
        if (shouldRestoreVici || (pendingViciReturnIndex !== null && target.vicinifyIndex < pendingViciReturnIndex))
            pendingViciReturnIndex = null;
        position = target.vicinifyIndex;
        showPage(nextPage, { fromHistory: true });
        if (shouldRestoreVici) window.ViciChat?.open?.();
        if (nextPage === 'page-place') {
            const id = target.vicinifyPlaceId || routes[position]?.placeId;
            // Leaving place details unmounts live subscriptions; resubscribe on return.
            if (id && typeof window.viewPlace === 'function') {
                const restorePosition = position;
                const restorePage = nextPage;
                // Reload the existing place (and its Suki listeners) without adding history.
                Promise.resolve().then(() => {
                    if (position === restorePosition && AppState.activePage === restorePage)
                        window.viewPlace(id, { fromNavigationHistory: true, restorePosition });
                }).catch(error => console.warn('[navigation] Could not restore place:', error));
            }
        }
    });
    return { remember, goBack, canGoBack, allowStudioBackOnce,
        markViciReturn: () => { if (AppState.activePage === 'page-map') pendingViciReturnIndex = position; },
        clearViciReturn: () => { pendingViciReturnIndex = null; },
        isAt: (index, page) => position === index && AppState.activePage === page,
        debugState: () => ({ routes: routes.map(r => r.page), position }) };
})();
window.ViciNavigation = ViciNavigation;
window.viciGoBack = fallback => ViciNavigation.goBack(fallback);

function showPage(pageId, options = {}) {
    if (!document.getElementById(pageId)) return;
    ViciNavigation.remember(pageId, options);
    const isMapPage = pageId === "page-map";

    applyViciPageScrollState(pageId);

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add("active");
        window._viciNavigationAnimation?.cancel();
        if (AppState.activePage !== pageId && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && typeof page.animate === 'function') {
            window._viciNavigationAnimation = page.animate([{opacity:.35},{opacity:1}], {duration:160,easing:'ease-out'});
        }
    }

    applyViciPageScrollState(pageId);
    resetViciPageScroll(pageId);
    requestAnimationFrame(() => resetViciPageScroll(pageId));

    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(`.nav-item[data-goto="${pageId}"]`).forEach(b => b.classList.add("active"));

    // Quota saver: stop page-specific Firestore listeners when leaving
    // their page. They re-subscribe when the page renders again.
    const prevPage = AppState.activePage;
    if (prevPage && prevPage !== pageId) {
        try {
            if (prevPage === "page-dashboard") window.DashboardPage?.stopAllListeners?.();
            if (prevPage === "page-settings") window.SettingsPage?.stopAllListeners?.();
            if (prevPage === "page-place") window.MapPage?.stopPlaceListeners?.();
            if (prevPage === "page-buzz") window.BuzzPage?.stopListeners?.();
        } catch (e) {}
    }

    AppState.activePage = pageId;

    const bottomNav = document.querySelector(".bottom-nav");
    if (pageId === "page-login") {
        document.body.classList.add("on-login");
        if (bottomNav) bottomNav.style.display = "none";
    } else {
        document.body.classList.remove("on-login");
        if (bottomNav) bottomNav.style.display = "flex";
    }

    if (pageId === "page-map") {
        // Return to the user's selected discovery view, including after Place details.
        const requestedView = options.discoveryView;
        const discoveryView = (requestedView === 'map' || requestedView === 'list')
            ? requestedView
            : (document.getElementById('page-map')?.dataset.view === 'list' ? 'list' : 'map');
        if (typeof window.toggleView === "function") {
            try { window.toggleView(discoveryView); } catch (e) { setTimeout(() => window.MapPage?.refresh?.(), 200); }
        } else {
            setTimeout(() => window.MapPage?.refresh?.(), 200);
        }
    }
    if (pageId === "page-buzz") window.BuzzPage?.render?.();
    if (pageId === "page-dashboard") window.DashboardPage?.render?.();
    if (pageId === "page-add") setTimeout(() => window.AddPage?.refreshMiniMap?.(), 200);
    if (pageId === "page-settings") window.SettingsPage?.render?.();

    // Floating order window hides on the hub, reappears elsewhere.
    setTimeout(() => { try { window.FloatingOrderWindow?.render(window._custBookingDocs || []); } catch (e) {} }, 60);

    setTimeout(() => resetViciPageScroll(pageId), 0);
    setTimeout(() => resetViciPageScroll(pageId), 80);
    setTimeout(() => resetViciPageScroll(pageId), 220);
    setTimeout(() => resetViciPageScroll(pageId), 420);
}

function initNav() {
    document.querySelectorAll(".nav-item, [data-goto]").forEach(btn => {
        if(btn.dataset.viciNavBound)return;
        btn.dataset.viciNavBound="true";
        btn.addEventListener("click", async event => {
            event.preventDefault();
            const target = btn.dataset.goto;
            if (!target) return;
            if(AppState.activePage!==target)try { window.NavSound?.nav(); } catch (e) {}
            
            if (!AppState.user && target !== "page-login") {
                showPage("page-login");
                return;
            }

            if (AppState.user && !AppState.user.emailVerified && (target === "page-add" || target === "page-dashboard")) {
                const ans = await window.vConfirm(
                    "Account Not Verified", 
                    "You must verify your email address to access this feature. Please check your inbox or spam folder.\n\nWould you like us to resend the verification link?", 
                    "Resend Link", 
                    false
                );
                
                if (ans) {
                    window.resendVerificationEmail();
                }
                return;
            }

            if (AppState.activePage === 'page-suki-studio' && target !== 'page-suki-studio') {
                if (!(await window.DashboardPage?.confirmLeaveSukiStudio?.())) return;
                window.DashboardPage?.cleanupSukiStudio?.();
            }
            showPage(target);
        });
    });
}

function loadSettings() {
    const s = readJSON(STORAGE.SETTINGS, { defaultRadius: 300 });
    AppState.radius = Number(s.defaultRadius || 300);
    return s;
}

function initAsk() {
    const askBtn = document.getElementById("askBtn");
    const askInput = document.getElementById("askInput");

    if (!askBtn || !askInput) return;

    function handleSpecialAsk(e) {
        const q = (askInput.value || "").trim().toLowerCase();

        if (q === "buzz") {
            e?.preventDefault?.();
            e?.stopImmediatePropagation?.();
            showPage("page-buzz");
            askInput.value = "";
            return true;
        }

        if (q === "add") {
            e?.preventDefault?.();
            e?.stopImmediatePropagation?.();

            if (AppState.user && !AppState.user.emailVerified) {
                window.alert("Please verify your email address first.");
                return true;
            }

            showPage("page-add");
            askInput.value = "";
            return true;
        }

        return false;
    }

    askBtn.addEventListener("click", handleSpecialAsk);

    askInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSpecialAsk(e);
        }
    });
}

// ---------- REAL FIREBASE LOGIN & SIGNUP (WITH EMAIL SENDING) ----------

// ---------- PASSWORD RESET (shared by Login + Settings) ----------
window.vicinifySendPasswordReset = async function(email) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error("Please enter a valid email address.");
    if (!window.auth) throw new Error("Authentication is not ready yet. Please try again.");
    await window.auth.sendPasswordResetEmail(cleanEmail);
    return cleanEmail;
};
window.vicinifyPasswordErrorMessage = function(error) {
    const code = error && error.code ? error.code : "";
    if (code === "auth/invalid-email") return "That email address looks invalid. Please check and try again.";
    if (code === "auth/too-many-requests") return "Too many reset attempts. Please wait a few minutes and try again.";
    if (code === "auth/network-request-failed") return "Network problem. Please check your connection and try again.";
    return (error && error.message) ? error.message : "Could not send reset email. Please try again.";
};

function initLogin() {
    const loginBtn = document.getElementById("loginBtn");
    const toggleAuthBtn = document.getElementById("toggleAuthBtn");
    const authBox = document.getElementById("authBox");
    let isLoginMode = true;

    // 🔥 TOGGLE PASSWORD VISIBILITY LOGIC 🔥
    const togglePassBtn = document.getElementById("togglePassBtn");
    const eyeIcon = document.getElementById("eyeIcon");
    const passInput = document.getElementById("loginPass");

    if (togglePassBtn && passInput && eyeIcon) {
        togglePassBtn.addEventListener("click", () => {
            const eyeIcon = document.getElementById("eyeIcon");
            if (passInput.type === "password") {
                passInput.type = "text";
                eyeIcon.setAttribute("data-lucide", "eye-off");
                togglePassBtn.style.color = "var(--ui-accent)";
            } else {
                passInput.type = "password";
                eyeIcon.setAttribute("data-lucide", "eye");
                togglePassBtn.style.color = "#94a3b8";
            }
            const visible = passInput.type === "text";
            togglePassBtn.setAttribute("aria-label", visible ? "Hide password" : "Show password");
            togglePassBtn.setAttribute("aria-pressed", String(visible));
            window.debouncedIcons?.();
        });
    }

    // ----- Forgot Password -----
    const forgotLink = document.getElementById("forgotPasswordLink");
    const forgotRow = document.getElementById("forgotRow");
    const forgotModal = document.getElementById("forgotModal");
    const forgotEmailInput = document.getElementById("forgotEmail");
    const forgotSendBtn = document.getElementById("forgotSendBtn");
    const forgotStatus = document.getElementById("forgotStatus");
    function openForgotModal() {
        if (!forgotModal) return;
        const emailInput = document.querySelector('input[type="email"]');
        if (forgotEmailInput && emailInput) forgotEmailInput.value = emailInput.value.trim();
        if (forgotStatus) { forgotStatus.textContent = ""; forgotStatus.className = "forgot-status"; }
        forgotModal.hidden = false; document.body.classList.add("modal-open");
        window.debouncedIcons?.();
        setTimeout(() => forgotEmailInput && forgotEmailInput.focus(), 50);
    }
    function closeForgotModal() { if (!forgotModal) return; forgotModal.hidden = true; document.body.classList.remove("modal-open"); }
    if (forgotLink) forgotLink.addEventListener("click", openForgotModal);
    if (forgotModal) {
        forgotModal.querySelectorAll("[data-close-forgot]").forEach(el => el.addEventListener("click", closeForgotModal));
        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !forgotModal.hidden) closeForgotModal(); });
    }
    if (forgotSendBtn) forgotSendBtn.addEventListener("click", async () => {
        const email = forgotEmailInput ? forgotEmailInput.value : "";
        forgotSendBtn.disabled = true; const oldText = forgotSendBtn.textContent; forgotSendBtn.textContent = "Sending...";
        try {
            await window.vicinifySendPasswordReset(email);
            if (forgotStatus) { forgotStatus.textContent = "If an account exists for that email, a password reset link has been sent. Please check your inbox and spam folder."; forgotStatus.classList.add("success"); }
            window.alert("Password reset email sent! Please check your inbox or spam folder.");
        } catch (error) {
            console.error("Password reset error:", error);
            if (error && error.code === "auth/user-not-found") {
                if (forgotStatus) { forgotStatus.textContent = "If an account exists for that email, a password reset link has been sent. Please check your inbox and spam folder."; forgotStatus.classList.add("success"); }
            } else if (forgotStatus) { forgotStatus.textContent = window.vicinifyPasswordErrorMessage(error); forgotStatus.classList.add("error"); }
        } finally { forgotSendBtn.disabled = false; forgotSendBtn.textContent = oldText; }
    });
    window.__vicinifySetForgotVisible = (v) => { if (forgotRow) forgotRow.style.display = v ? "" : "none"; };

    // 🔥 PASSWORD STRENGTH LOGIC 🔥
    const reqLength = document.getElementById("reqLength");
    const reqUpper = document.getElementById("reqUpper");
    const reqNum = document.getElementById("reqNum");
    const reqSpec = document.getElementById("reqSpec");
    const pwText = document.getElementById("pwText");
    const bars = [document.getElementById("pwBar1"), document.getElementById("pwBar2"), document.getElementById("pwBar3"), document.getElementById("pwBar4")];

    let isPasswordStrong = false; 

    if (passInput) {
        passInput.addEventListener("input", (e) => {
            if (isLoginMode) return;

            const val = e.target.value;
            let score = 0;

            const checks = window.PasswordPolicy.check(val);
            const hasLength = checks.length;
            const hasUpperLower = checks.case;
            const hasNum = checks.number;
            const hasSpec = checks.special;

            if (reqLength) { reqLength.style.color = hasLength ? "#10b981" : "#64748b"; reqLength.classList.toggle("met", hasLength); }
            if (reqUpper) { reqUpper.style.color = hasUpperLower ? "#10b981" : "#64748b"; reqUpper.classList.toggle("met", hasUpperLower); }
            if (reqNum) { reqNum.style.color = hasNum ? "#10b981" : "#64748b"; reqNum.classList.toggle("met", hasNum); }
            if (reqSpec) { reqSpec.style.color = hasSpec ? "#10b981" : "#64748b"; reqSpec.classList.toggle("met", hasSpec); }

            if (hasLength) score++;
            if (hasUpperLower) score++;
            if (hasNum) score++;
            if (hasSpec) score++;

            bars.forEach(b => { if(b) b.style.background = "#e2e8f0"; });

            if (val.length > 0) {
                if (score <= 1) {
                    if (bars[0]) bars[0].style.background = "#ef4444"; 
                    if (pwText) { pwText.textContent = "Weak Password"; pwText.style.color = "#ef4444"; }
                    isPasswordStrong = false;
                } else if (score === 2 || score === 3) {
                    if (bars[0]) bars[0].style.background = "#facc15"; 
                    if (bars[1]) bars[1].style.background = "#facc15";
                    if (score === 3 && bars[2]) bars[2].style.background = "#facc15";
                    if (pwText) { pwText.textContent = "Medium Password"; pwText.style.color = "#ca8a04"; }
                    isPasswordStrong = false;
                } else if (score === 4) {
                    bars.forEach(b => { if(b) b.style.background = "#10b981"; }); 
                    if (pwText) { pwText.textContent = "Strong Password"; pwText.style.color = "#10b981"; }
                    isPasswordStrong = true;
                }
            } else {
                if (pwText) { pwText.textContent = "Password Strength"; pwText.style.color = "#64748b"; }
                isPasswordStrong = false;
            }
        });
    }

    if (toggleAuthBtn) {
        toggleAuthBtn.addEventListener("click", () => {
            isLoginMode = !isLoginMode;
            const signupFields = document.querySelectorAll(".signup-field");

            if (isLoginMode) {
                authBox.classList.remove("signup-mode");
                document.getElementById("authTitle").textContent = "Welcome to Vicinify";
                document.getElementById("authSubtitle").textContent = "Sign in to continue to Lipa's local guide";
                loginBtn.textContent = "Sign in";
                loginBtn.disabled = false;
                toggleAuthBtn.textContent = "Sign up";
                const promptEl = document.getElementById("authPrompt"); if (promptEl) promptEl.textContent = "Don't have an account?";
                document.getElementById("authTabSignIn")?.classList.add("active");
                document.getElementById("authTabSignUp")?.classList.remove("active");
                if (passInput) passInput.setAttribute("autocomplete", "current-password");
                signupFields.forEach(el => el.style.display = "none");
                if (window.__vicinifySetForgotVisible) window.__vicinifySetForgotVisible(true);
            } else {
                authBox.classList.add("signup-mode");
                document.getElementById("authTitle").textContent = "Create your account";
                document.getElementById("authSubtitle").textContent = "Join Vicinify and discover Lipa City";
                loginBtn.textContent = "Create Account";
                const agreeTermsGate = document.getElementById("agreeTerms");
                loginBtn.disabled = !(agreeTermsGate && agreeTermsGate.checked);
                toggleAuthBtn.textContent = "Sign in";
                const promptEl2 = document.getElementById("authPrompt"); if (promptEl2) promptEl2.textContent = "Already have an account?";
                document.getElementById("authTabSignUp")?.classList.add("active");
                document.getElementById("authTabSignIn")?.classList.remove("active");
                if (passInput) passInput.setAttribute("autocomplete", "new-password");
                signupFields.forEach(el => el.style.display = "block");
                if (window.__vicinifySetForgotVisible) window.__vicinifySetForgotVisible(false);
                
                // Trigger input para mag-reset ang UI sa una
                if (passInput) passInput.dispatchEvent(new Event("input"));
            }
        });
    }


    // Auth tabs: clicking the inactive tab performs the same toggle as the footer switch
    const tabIn = document.getElementById("authTabSignIn");
    const tabUp = document.getElementById("authTabSignUp");
    if (tabIn) tabIn.addEventListener("click", () => { if (!isLoginMode) toggleAuthBtn?.click(); });
    if (tabUp) tabUp.addEventListener("click", () => { if (isLoginMode) toggleAuthBtn?.click(); });

    // PLUS45: Terms and Conditions — checkbox gates Create Account (Sign Up mode only)
    const agreeTermsBox = document.getElementById("agreeTerms");
    if (agreeTermsBox) {
        agreeTermsBox.addEventListener("change", () => {
            if (!isLoginMode && loginBtn) loginBtn.disabled = !agreeTermsBox.checked;
        });
    }
    const openTermsLink = document.getElementById("openTermsLink");
    window.closeTermsModal=()=>{const modal=document.getElementById('termsModal');modal?.classList.add('hidden');modal?.setAttribute('aria-hidden','true');openTermsLink?.focus();};
    if (openTermsLink) {
        openTermsLink.addEventListener("click", () => {
            const modal=document.getElementById('termsModal');modal?.classList.remove('hidden');modal?.setAttribute('aria-hidden','false');modal?.querySelector('.modalClose')?.focus();
        });
    }
    document.getElementById('termsModal')?.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();window.closeTermsModal();}
        if(event.key==='Tab'){const buttons=[...event.currentTarget.querySelectorAll('button')];if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();buttons.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===buttons.at(-1)){event.preventDefault();buttons[0]?.focus();}}
    });

    if (loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const emailInput = document.querySelector('input[type="email"]');
            const nameInput = document.querySelector('input[placeholder="e.g., Cylo De Torres"]');

            const email = emailInput ? emailInput.value.trim() : "";
            const password = passInput ? passInput.value : "";
            const fullName = nameInput ? nameInput.value.trim() : "User";

            if (!email || !password) {
                return window.alert("Please enter your email and password.");
            }

            const nameProblem = !isLoginMode && window.ContentPolicy?.error('name',fullName);
            if(nameProblem) return window.alert(nameProblem);
            if (!isLoginMode && fullName.length < 2) {
                return window.alert("Please enter your full name.");
            }

            // 💥 BAGO: I-block kung hindi pa strong ang password sa Sign Up 💥
            if (!isLoginMode && !window.PasswordPolicy.isStrong(passInput.value)) {
                return window.alert("Please create a Strong Password based on the requirements below.");
            }

            // PLUS45: Terms and Conditions agreement is required to create an account
            if (!isLoginMode && !document.getElementById("agreeTerms")?.checked) {
                return window.alert("Please agree to the Terms and Conditions to create your account.");
            }

            // A selected demo URL belongs only to its designated account.
            // Do not let a different demo account overwrite its Firebase slot.
            const demoLoginError = isLoginMode ? window.VicinifyDemoSwitch?.validateLoginEmail?.(email) : '';
            if (demoLoginError) return window.alert(demoLoginError);

            loginBtn.disabled = true;
            loginBtn.textContent = isLoginMode ? "Authenticating..." : "Creating Account...";

            try {
                if (isLoginMode) {
                    // Keep each authenticated demo session across page reloads.
                    if (window.VicinifyDemoSwitch && window.firebase?.auth?.Auth?.Persistence?.LOCAL) {
                        await window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                    }
                    await window.auth.signInWithEmailAndPassword(email, password);
                } else {
                    const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
                    const user = userCredential.user;

                    await user.sendEmailVerification();

                    await window.db.collection("users").doc(user.uid).set({
                        uid: user.uid,
                        fullName: fullName,
                        email: user.email || email,
                        role: "user",
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                    window.alert("Account created successfully! A verification link has been sent to your email. Please verify to access all features.");
                }
            } catch (error) {
                // Login errors are generic (prevents email enumeration:
                // "user not found" vs "wrong password"). Signup keeps
                // specific messages (email in use, weak password) for UX.
                const msg = isLoginMode
                    ? "Invalid email or password. Please try again."
                    : ("Error: " + error.message);
                window.alert(msg);
                loginBtn.disabled = false;
                loginBtn.textContent = isLoginMode ? "Sign in" : "Create Account";
            }
        });
    }
}

window.resendVerificationEmail = async function() {
    const user = window.auth.currentUser;
    if (user && !user.emailVerified) {
        try {
            await user.sendEmailVerification();
            window.alert("Verification email sent! Please check your inbox or spam folder.");
        } catch (e) {
            window.alert("Error sending email: " + e.message);
        }
    } else {
        window.alert("Your account is already verified or you are not logged in.");
    }
};

let currentUserDocUnsub = null;

// ---------- FIREBASE AUTH STATE LISTENER ----------
window.clearAccountCredentials = function() {
    for(const id of ['loginEmail','loginPass','regName','forgotEmail','settingsCurrentPass','settingsNewPass','settingsConfirmPass']){
        const input=document.getElementById(id);if(input){input.value='';input.defaultValue='';if(id==='loginPass')input.type='password';}
    }
    document.querySelectorAll('#ownershipTransferModal input[type=password],#accountDeletionModal input[type=password]').forEach(input=>{input.value='';});
    document.getElementById('ownershipTransferModal')?.remove();
    if(!window.isSelfDeleting)document.getElementById('accountDeletionModal')?.remove();
    const toggle=document.getElementById('togglePassBtn');if(toggle){toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-label','Show password');toggle.style.color='';}
    document.getElementById('eyeIcon')?.setAttribute('data-lucide','eye');
    window.debouncedIcons?.();
};
window.addEventListener('pageshow',event=>{if(event.persisted&&!window.auth?.currentUser)window.clearAccountCredentials();});

window.auth.onAuthStateChanged(async (user) => {
    const loginBtn = document.getElementById("loginBtn");
    const dashNavBtn = document.querySelector('.nav-item[data-goto="page-dashboard"]');

    if (currentUserDocUnsub) {
        currentUserDocUnsub();
        currentUserDocUnsub = null;
    }

    if (user) {
        await user.reload();
        if(await window.AccountDeletion?.resumeIfPending(user))return;

        AppState.user = window.auth.currentUser;
        window.clearAccountCredentials();

        // Single user-doc read: the live snapshot below doubles as the
        // profile loader (previously a separate .get() duplicated this read).
        let profileApplied = false;
        const applyProfileToUI = () => {
            if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = "Sign in"; }
            if (dashNavBtn) {
                // One-tab rule: the hub tab is for everyone. Standard users
                // see "My Activity"; owners/admins see "Business Hub".
                dashNavBtn.style.display = "flex";
                const navText = dashNavBtn.querySelector(".navText");
                if (navText) {
                    const role=AppState.userProfile?.role;
                    const hubLabel=role=== "admin" ? "Admin Hub" : role=== "user" ? "My Activity" : "Business Hub";
                    navText.textContent = hubLabel;
                    navText.setAttribute("data-i18n", hubLabel);
                }
            }
            if (profileApplied) return;
            profileApplied = true;
            if (window.GlobalNotifier) {
                setTimeout(() => { if (window.auth?.currentUser?.uid === user.uid) window.GlobalNotifier.start(user); }, 1500);
            }
            window.db.collection("public_profiles").doc(user.uid).set({ fullName: String(AppState.userProfile?.fullName || "Customer").slice(0, 120) }).catch(() => {});
            if (!AppState.user.emailVerified) {
                setTimeout(() => {
                    if (window.alert) window.alert("Your account is unverified. Please check your email to verify your account.");
                }, 2500);
            }
            showPage("page-map", { resetHistory: true });
        };

        currentUserDocUnsub = window.db.collection("users").doc(user.uid).onSnapshot(async doc => {
            if (!doc.exists) {
                if (AppState.userProfile != null) {
                    if (window.isSelfDeleting) return;
                    window.alert("Your account has been removed from the system. You will be logged out.");
                    window.auth.signOut();
                    window.location.reload();
                    return;
                }
                const fallbackProfile = {
                    uid: user.uid,
                    fullName: user.displayName || "User",
                    email: user.email || "",
                    role: "user",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                try {
                    await window.db.collection("users").doc(user.uid).set(fallbackProfile, { merge: true });
                } catch (e) {
                    console.log("Error creating profile:", e);
                }
                AppState.userProfile = fallbackProfile;
            } else {
                const profileData = doc.data();
                // Permanent admin lock: this UID is always admin, even if
                // the profile doc role was changed or recreated.
                if (user.uid === "Z45NZhQTgsTUX79WJ5ksCH8N3c02") profileData.role = "admin";
                AppState.userProfile = profileData;
            }
            applyProfileToUI();
        }, err => {
            window.handleFirestoreError(err);
            if (!AppState.userProfile) {
                AppState.userProfile = { uid: user.uid, fullName: "User", email: user.email || "", role: "user" };
            }
            applyProfileToUI();
        });
    } else {
        window.clearAccountCredentials();
        // Called after the switcher's auth callback so sign-out cleanup does
        // not erase its one-time-login email hint.
        window.VicinifyDemoSwitch?.restoreLoginEmail?.();
        AppState.user = null;
        AppState.userProfile = null;
        if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = "Sign in"; }

        if (window.GlobalNotifier) {
            window.GlobalNotifier.stop();
        }

        // Stop all Firestore listeners BEFORE they error on lost auth
        // (prevents "Could not load ..." toasts right after logout).
        try { window.SettingsPage && window.SettingsPage.stopAllListeners && window.SettingsPage.stopAllListeners(); } catch (e) {}
        try { window.DashboardPage && window.DashboardPage.stopAllListeners && window.DashboardPage.stopAllListeners(); } catch (e) {}
        try { window.MapPage && window.MapPage.stopPlaceListeners && window.MapPage.stopPlaceListeners(); } catch (e) {}
        // The open chat-room listener belongs to this auth session too.
        if (currentChatUnsub) { try { currentChatUnsub(); } catch (e) {} currentChatUnsub = null; }
        // Clear Vici AI chat panel so the next account doesn't see the
        // previous user's conversation (privacy on shared devices).
        try { window.MapPage && window.MapPage.resetViciAI && window.MapPage.resetViciAI(); } catch (e) {}

        window.DashboardPage?.resetSession?.();
        window.closeChatModal?.();
        document.getElementById('chatMessageList')?.replaceChildren();
        currentChatDocsCache = [];
        window.ViciData?.stop();
        showPage("page-login", { resetHistory: true });
    }
});

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", () => {
document.body.classList.add("on-login");
loadSettings();
initNav();
initLogin();

setupChatActionButtons();

const unlockAudio = () => {
    const unlock = new Audio();
    unlock.play().catch(() => {});
    document.removeEventListener("click", unlockAudio);
    document.removeEventListener("touchstart", unlockAudio);
};

document.addEventListener("click", unlockAudio);
document.addEventListener("touchstart", unlockAudio);

});

// ==========================================================
// 🔥 VICINIFY IN-CHAT TRANSACTION HUB — FINAL WITH FEEDBACK
// ==========================================================
let currentChatUnsub = null;
let currentChatContext = { isOwner: false, pendingRequirementId: null, requestType: null };
// Latest rendered thread docs, so chat-card actions reuse them instead
// of re-reading the message doc (its fields never change after send).
let currentChatDocsCache = [];


function setupChatActionButtons() {
const chatInput = document.getElementById("chatMessageInput");
if (!chatInput || !chatInput.parentElement) return;

["chatAddressBtn", "chatShareLocationBtn", "chatPaymentBtn", "chatOrderBtn", "chatRequirementBtn"].forEach(id => {
    const oldBtn = document.getElementById(id);
    if (oldBtn) oldBtn.remove();
});

let actionBar = document.getElementById("chatQuickActions");
if (!actionBar) {
    actionBar = document.createElement("div");
    actionBar.id = "chatQuickActions";
    actionBar.hidden = true;
    chatInput.parentElement.insertBefore(actionBar, chatInput);
}
const makeActionBtn = (id, label, title, bg, color) => {
    const btn = document.createElement("button");
    btn.id = id;
    btn.type = "button";
    btn.innerHTML = label;
    btn.title = title;
    btn.setAttribute("aria-label", title);
    btn.style.cssText = `
        width:38px;
        height:38px;
        border-radius:50%;
        border:1px solid #e2e8f0;
        background:${bg};
        color:${color};
        cursor:pointer;
        font-size:17px;
        display:none;
        align-items:center;
        justify-content:center;
        flex-shrink:0;
        box-shadow:0 4px 12px rgba(15,23,42,0.08);
    `;
    btn.onclick = () => {
        if (currentChatContext.pendingRequirementId && window.openRequirementResponseModal) {
            window.openRequirementResponseModal(currentChatContext.pendingRequirementId);
        } else {
            window.alert("No active delivery/details request yet. Wait for the business to accept or request details.");
        }
    };
    actionBar.appendChild(btn);
    return btn;
};

makeActionBtn("chatAddressBtn", '<i data-lucide="home"></i>', "Submit delivery address", "#fff7ed", "#c2410c");
makeActionBtn("chatShareLocationBtn", '<i data-lucide="map-pin"></i>', "Submit current location", "#ecfdf5", "#047857");
makeActionBtn("chatOrderBtn", '<i data-lucide="clipboard-pen"></i>', "Submit order details", "#f8fafc", "#0f172a");

const reqBtn = document.createElement("button");
reqBtn.id = "chatRequirementBtn";
reqBtn.type = "button";
reqBtn.innerHTML = '<i data-lucide="clipboard-list"></i>';
reqBtn.title = "Request transaction requirements";
reqBtn.setAttribute("aria-label", reqBtn.title);
reqBtn.style.cssText = `
    width:40px;
    height:40px;
    border-radius:50%;
    border:1px solid #cbd5e1;
    background:var(--ui-surface);
    cursor:pointer;
    font-size:18px;
    display:none;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
    box-shadow:0 4px 12px rgba(15,23,42,0.08);
`;

reqBtn.onclick = () => window.openRequirementRequestModal();
actionBar.appendChild(reqBtn);

}

function updateChatQuickActions(isOwner, pendingRequirement) {
currentChatContext.isOwner = !!isOwner;
currentChatContext.pendingRequirementId = pendingRequirement?.id || null;
currentChatContext.requestType = pendingRequirement?.requestType || null;
currentChatContext.activeTransactionId = pendingRequirement?.transactionId || pendingRequirement?.bookingId || null;

const ownerBtn = document.getElementById("chatRequirementBtn");
if (ownerBtn) ownerBtn.style.display = isOwner ? "inline-flex" : "none";

const req = pendingRequirement?.requirements || {};
const showCustomerQuick = !isOwner && !!pendingRequirement && (pendingRequirement.requirementStatus || "waiting_customer") === "waiting_customer";

const buttonMap = {
    chatAddressBtn: !!req.address,
    chatShareLocationBtn: !!req.location,
    chatOrderBtn: !!req.orderDetails
};

Object.entries(buttonMap).forEach(([id, shouldShow]) => {
    const btn = document.getElementById(id);
    if (btn) btn.style.display = showCustomerQuick && shouldShow ? "inline-flex" : "none";
});
const actionBar = document.getElementById("chatQuickActions");
if (actionBar) actionBar.hidden = !isOwner && !(showCustomerQuick && Object.values(buttonMap).some(Boolean));
}

function setupChatSuggestions(isOwnerView) {
    const input = document.getElementById("chatMessageInput");
    if (!input?.parentElement) return;
    let group = document.getElementById("chatSuggestions");
    if (!group) {
        group = document.createElement("div");
        group.id = "chatSuggestions";
        group.className = "chat-suggestions";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", "Suggested questions");
        const label = document.createElement("span");
        label.className = "chat-suggestions-label";
        label.textContent = "Quick questions";
        const heading = document.createElement("div");
        heading.className = "chat-suggestions-heading";
        heading.appendChild(label);
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "chat-suggestions-toggle";
        toggle.textContent = "Hide";
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-controls", "chatSuggestionChoices");
        heading.appendChild(toggle);
        group.appendChild(heading);
        const choices = document.createElement("div");
        choices.id = "chatSuggestionChoices";
        choices.className = "chat-suggestion-choices";
        toggle.addEventListener("click", () => {
            choices.hidden = !choices.hidden;
            toggle.textContent = choices.hidden ? "Show" : "Hide";
            toggle.setAttribute("aria-expanded", String(!choices.hidden));
        });
        group.appendChild(choices);
        const questions = window.ContentPolicy?.quickQuestions ? Object.values(window.ContentPolicy.quickQuestions).map(q=>[q.label,q.text]) : [
            ["View menu", "Hi! Can I see your menu, please?"],
            ["Opening hours", "Hi! What are your opening hours?"],
            ["Delivery options", "Hi! Do you offer delivery, and which areas do you cover?"],
            ["Book a table", "Hi! Can I reserve a table? What details do you need?"]
        ];
        questions.forEach(([title, message]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = title;
            button.className = "chat-suggestion";
            button.setAttribute("aria-label", "Send question: " + message);
            button.addEventListener("click", () => {
                if (group.dataset.customer !== "true" || window.__chatSending) return;
                // Send only this selected question; never append or send a draft.
                window.sendChatMessage?.({text:message});
            });
            choices.appendChild(button);
        });
        input.parentElement.insertBefore(group, input);
        input.addEventListener("input", () => {
            group.hidden = group.dataset.customer !== "true" || !!input.value.trim();
        });
    }
    group.dataset.customer = String(!isOwnerView);
    group.hidden = isOwnerView || !!input.value.trim();
}

function setupChatComposer() {
    const input = document.getElementById("chatMessageInput");
    if (!input) return;
    const resize = () => {
        input.style.height = "auto";
        input.style.height = Math.max(44, Math.min(input.scrollHeight, 112)) + "px";
    };
    if (!input.dataset.composerReady) {
        input.dataset.composerReady = "true";
        input.addEventListener("input", resize);
        input.addEventListener("keydown", event => {
            if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
                event.preventDefault();
                window.sendChatMessage();
            }
        });
    }
    resize();
}

function splitPaymentMethods(raw) {
return String(raw || "")
.split(",")
.map(x => x.trim())
.filter(Boolean);
}

function getInitial(name) {
return String(name || "U").charAt(0).toUpperCase();
}

// Display-name memo: these helpers are called inside render loops and
// per message; without a cache each call costs 1 read for the same name.
const _nameMemo = new Map();
function _memoGet(key) {
    const hit = _nameMemo.get(key);
    if (hit && (Date.now() - hit.at) < 300000) return hit.value;
    return null;
}
function _memoSet(key, value) { _nameMemo.set(key, { value, at: Date.now() }); }

async function getCustomerDisplayName(customerUid) {
if (!customerUid) return "Customer";
const memoHit = _memoGet("u:" + customerUid);
if (memoHit) return memoHit;

try {
    const userDoc = await window.db.collection("public_profiles").doc(customerUid).get();

    if (userDoc.exists) {
        const data = userDoc.data();
        const name = data.fullName || data.displayName || "Customer";
        _memoSet("u:" + customerUid, name);
        return name;
    }
} catch (e) {
    console.warn("Customer name lookup failed:", e);
}

return "Customer";

}

async function getPlaceDisplayName(placeId, fallbackName = "Establishment") {
if (!placeId) return fallbackName || "Establishment";
const memoHit = _memoGet("p:" + placeId);
if (memoHit) return memoHit;

try {
    const placeDoc = await window.db.collection("places").doc(placeId).get();

    if (placeDoc.exists) {
        const data = placeDoc.data();
        const name = data.name || fallbackName || "Establishment";
        _memoSet("p:" + placeId, name);
        return name;
    }
} catch (e) {
    console.warn("Place name lookup failed:", e);
}

return fallbackName || "Establishment";

}

function getStatusBadgeStyle(status) {
const s = String(status || "info").toLowerCase();

const map = {
    pending: {
        bg: "#fef3c7",
        color: "#92400e",
        label: "Waiting for Business Acceptance"
    },
    accepted: {
        bg: "#dcfce7",
        color: "#166534",
        label: "Accepted by Business"
    },
    rejected: {
        bg: "#fee2e2",
        color: "#991b1b",
        label: "Rejected by Business"
    },
    fulfilled: {
        bg: "var(--ui-success-bg)",
        color: "var(--ui-success-ink)",
        label: "Marked Fulfilled by Business"
    },
    received: {
        bg: "#ede9fe",
        color: "#5b21b6",
        label: "Confirmed Received by Customer"
    },
    waiting_customer: {
        bg: "#fef3c7",
        color: "#92400e",
        label: "Waiting for Customer Response"
    },
    submitted: {
        bg: "#dcfce7",
        color: "#166534",
        label: "Submitted by Customer"
    },
    confirmed: {
        bg: "#ede9fe",
        color: "#5b21b6",
        label: "Confirmed by Business"
    },
    pending_confirmation: {
        bg: "#fef3c7",
        color: "#92400e",
        label: "Waiting for Business Confirmation"
    },
    payment_submitted: {
        bg: "#fef3c7",
        color: "#92400e",
        label: "Payment Proof Submitted"
    },
    payment_confirmed: {
        bg: "#dcfce7",
        color: "#166534",
        label: "Payment Confirmed by Business"
    },
    preparing: {
        bg: "#ffedd5",
        color: "#c2410c",
        label: "Preparing Order"
    },
    out_for_delivery: {
        bg: "#e0f2fe",
        color: "#0369a1",
        label: "Out for Delivery"
    },
    delivered: {
        bg: "#dcfce7",
        color: "#166534",
        label: "Delivered by Business"
    },
    fulfilled_waiting_customer: {
        bg: "var(--ui-success-bg)",
        color: "var(--ui-success-ink)",
        label: "Waiting for Customer Confirmation"
    },
    feedback_waiting: {
        bg: "var(--ui-success-bg,#e7f3ed)",
        color: "var(--ui-success-ink,#28634b)",
        label: "Waiting for Customer Feedback"
    },
    feedback_submitted: {
        bg: "#dcfce7",
        color: "#166534",
        label: "Feedback Submitted by Customer"
    }
};

return map[s] || {
    bg: "#e0f2fe",
    color: "#0369a1",
    label: String(status || "Info")
};

}

function makeBadge(status) {
const style = getStatusBadgeStyle(status);

return `
    <span style="display:inline-block; margin-left:4px; padding:4px 9px; border-radius:999px; font-size:10px; font-weight:800; background:${style.bg}; color:${style.color};">
        ${escapeHtml(style.label)}
    </span>
`;

}

function getRequestMeta(requestType) {
const key = String(requestType || "table_reservation").toLowerCase();

const map = {
    booking: {
        key: "booking",
        icon: "📅",
        title: "General Booking Request",
        shortLabel: "Booking",
        color: "var(--ui-accent)",
        light: "var(--ui-success-bg)",
        dark: "var(--ui-success-ink)",
        fulfillLabel: "Mark as Fulfilled",
        confirmLabel: "Confirm Completed"
    },
    table: {
        key: "table_reservation",
        icon: "🍽️",
        title: "Table Reservation Request",
        shortLabel: "Table Reservation",
        color: "#f97316",
        light: "#ffedd5",
        dark: "#c2410c",
        fulfillLabel: "Mark Dining Completed",
        confirmLabel: "Confirm Completed"
    },
    table_reservation: {
        key: "table_reservation",
        icon: "🍽️",
        title: "Table Reservation Request",
        shortLabel: "Table Reservation",
        color: "#f97316",
        light: "#ffedd5",
        dark: "#c2410c",
        fulfillLabel: "Mark Dining Completed",
        confirmLabel: "Confirm Completed"
    },
    food: {
        key: "food_reservation",
        icon: "🍱",
        title: "Food Reservation Request",
        shortLabel: "Food Reservation",
        color: "#16a34a",
        light: "#dcfce7",
        dark: "#166534",
        fulfillLabel: "Mark Food Prepared",
        confirmLabel: "Confirm Received"
    },
    food_reservation: {
        key: "food_reservation",
        icon: "🍱",
        title: "Food Reservation Request",
        shortLabel: "Food Reservation",
        color: "#16a34a",
        light: "#dcfce7",
        dark: "#166534",
        fulfillLabel: "Mark Food Prepared",
        confirmLabel: "Confirm Received"
    },
    pickup: {
        key: "pickup_order",
        icon: "🛍️",
        title: "Pickup Order Request",
        shortLabel: "Pickup Order",
        color: "#7c3aed",
        light: "#ede9fe",
        dark: "#5b21b6",
        fulfillLabel: "Mark Ready for Pickup",
        confirmLabel: "Confirm Picked Up"
    },
    pickup_order: {
        key: "pickup_order",
        icon: "🛍️",
        title: "Pickup Pre-order Request",
        shortLabel: "Pickup Pre-order",
        color: "#7c3aed",
        light: "#ede9fe",
        dark: "#5b21b6",
        fulfillLabel: "Mark Ready for Pickup",
        confirmLabel: "Confirm Picked Up"
    },
    advance_order: {
        key: "advance_order",
        icon: "🗓️",
        title: "Advance Order Request",
        shortLabel: "Advance Order",
        color: "#ea580c",
        light: "#ffedd5",
        dark: "#9a3412",
        fulfillLabel: "Mark Order Completed",
        confirmLabel: "Confirm Received"
    },
    delivery: {
        key: "delivery_order",
        icon: "🛵",
        title: "Delivery Order Request",
        shortLabel: "Delivery Order",
        color: "#0ea5e9",
        light: "#e0f2fe",
        dark: "#0369a1",
        fulfillLabel: "Mark Delivered",
        confirmLabel: "Confirm Received"
    },
    delivery_order: {
        key: "delivery_order",
        icon: "🛵",
        title: "Delivery Order Request",
        shortLabel: "Delivery Order",
        color: "#0ea5e9",
        light: "#e0f2fe",
        dark: "#0369a1",
        fulfillLabel: "Mark Delivered",
        confirmLabel: "Confirm Received"
    }
};

return map[key] || map.table_reservation;

}

function renderRequestDetailRows(d) {
    const legacy = {}; let current = '';
    String(d.details || '').split(/\r?\n/).forEach(line => {
        const match = line.match(/^(Date|Time|Table|Guests|Seating(?: Preference)?|Occasion|Items(?: \/ Order)?|Order|Fulfillment|Payment(?: Method| Type)?|Delivery Address|Address|Purpose|Notes):\s*(.*)$/i);
        if (match) { current = match[1].toLowerCase(); legacy[current] = match[2]; }
        else if (current) legacy[current] += (legacy[current] ? '\n' : '') + line;
    });
    const take = (field,...keys) => d[field] != null && String(d[field]).trim() ? String(d[field]) : keys.map(k=>legacy[k]).find(v=>v && v.trim()) || '';
    const visible = value => value && !/^(none|no preference|n\/a)$/i.test(value.trim());
    const t = value => window.LangManager?.translateKey?.(value) || value;
    let date = take('bookingDate','date'), time = take('bookingTime','time');
    const rawDate = date, rawTime = time;
    const locale = window.LangManager?.getLanguage?.() === 'ph' ? 'fil-PH' : 'en-PH';
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const stamp = new Date(date+'T12:00:00+08:00');
        if(Number.isFinite(stamp.getTime())) date = new Intl.DateTimeFormat(locale,{timeZone:'Asia/Manila',month:'short',day:'numeric',year:'numeric'}).format(stamp);
    }
    if (/^\d{2}:\d{2}$/.test(time)) {
        const stamp = new Date('2026-01-01T'+time+':00+08:00');
        if(Number.isFinite(stamp.getTime())) time = new Intl.DateTimeFormat(locale,{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit'}).format(stamp);
    }
    const items = take('orderItems','items / order','items','order');
    const purpose = take('purpose','purpose');
    let notes = take('bookingDetails','notes');
    if (notes.trim() === items.trim() || notes.trim() === purpose.trim()) notes = '';
    const rows = [
        ['Date',date,true,'date',rawDate],['Time',time,true,'time',rawTime],
        ['Guests',take('guestCount','guests'),true,'guests'],
        ['Table',take('tableName','table'),true,'table'],
        ['Items / Order',items,true,'items'],
        ['Estimated menu subtotal',Number.isInteger(d.estimatedSubtotalCents)?'₱'+(d.estimatedSubtotalCents/100).toFixed(2):'',true,'estimatedSubtotal'],['Request reference',d.reference||'',true,'requestReference'],
        ['Fulfillment',take('fulfillmentType','fulfillment'),false,'fulfillment'],
        ['Payment Type',take('paymentType','payment type'),false,'paymentType'],
        ['Payment',take('paymentMethod','payment method','payment'),false,'payment'],
        ['Delivery Address',take('deliveryAddress','delivery address','address'),true,'address'],
        ['Seating',take('seatingPreference','seating preference','seating'),false,'seating'],
        ['Occasion',take('occasion','occasion'),false,'occasion'],
        ['Purpose',purpose,true,'purpose'],['Notes',notes,true,'notes'],
        ['Refund status',d.refundStatus ? d.refundStatus.replace(/_/g,' ') : '',false,'refundStatus'],['Refund amount',d.refundAmount!=null?'₱'+d.refundAmount:'',true,'refundAmount'],['Refund reference',d.refundReference||'',true,'refundReference']
    ].filter(([,value])=>visible(value));
    if (!rows.length) return d.details
        ? `<p class="request-output-fallback" data-no-translate>${escapeHtml(d.details)}</p>`
        : `<p class="request-output-fallback">${escapeHtml(t('No additional details.'))}</p>`;
    return `<dl class="request-output-grid">${rows.map(([label,value,personal,field,raw])=>`<div class="request-output-field" data-request-field="${field}"><dt data-i18n="${escapeHtml(label)}">${escapeHtml(t(label))}</dt><dd${personal?' data-no-translate':` data-i18n="${escapeHtml(value)}"`}>${raw?`<time datetime="${escapeHtml(raw)}">${escapeHtml(value)}</time>`:escapeHtml(personal?value:t(value))}</dd></div>`).join('')}</dl>`;
}

function getCardSide(d, currentUid, isOwnerView, fallbackSenderRole = "customer") {
if (d.senderUid) {
return d.senderUid === currentUid ? "flex-end" : "flex-start";
}

if (d.createdBy && d.createdBy !== "system") {
    return d.createdBy === currentUid ? "flex-end" : "flex-start";
}

if (d.senderRole) {
    const myRole = isOwnerView ? "owner" : "customer";

    if (d.senderRole === "system") {
        return "flex-start";
    }

    return d.senderRole === myRole ? "flex-end" : "flex-start";
}

if (fallbackSenderRole === "owner") {
    return isOwnerView ? "flex-end" : "flex-start";
}

return isOwnerView ? "flex-start" : "flex-end";

}

function injectChatStyles() {
    if (document.getElementById("vicinifyChatStyles")) return;

    const style = document.createElement("style");
    style.id = "vicinifyChatStyles";
    style.innerHTML = `
        #chatModal { z-index: 9998 !important; }
        #chatModal .modalBackdrop { z-index: 9998 !important; }
        #chatModal .modalBox { z-index: 9999 !important; }
        .vtx-command { position: relative; top: auto; z-index: 1; background:var(--ui-surface); border: 1px solid #e2e8f0; border-radius: 18px; padding: 12px; margin: 10px auto 14px; width: calc(100% - 16px); box-shadow: 0 6px 18px rgba(15,23,42,0.08); box-sizing: border-box; }
        .vtx-command-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; }
        .vtx-title { display:flex; align-items:center; gap:10px; min-width:0; }
        .vtx-icon { width:40px; height:40px; border-radius:14px; display:flex; align-items:center; justify-content:center; color:white; font-size:20px; box-shadow:0 8px 18px rgba(15,23,42,0.16); }
        .vtx-name { font-size:13px; font-weight:900; color:var(--ui-ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:210px; }
        .vtx-sub { font-size:11px; color:var(--ui-muted); font-weight:700; margin-top:2px; }
        .vtx-pill { font-size:10px; font-weight:900; border-radius:999px; padding:6px 9px; white-space:nowrap; }
        .vtx-progress { width:100%; height:8px; border-radius:999px; background:#e2e8f0; overflow:hidden; margin:10px 0 12px; }
        .vtx-progress-fill { height:100%; border-radius:999px; transition:width .35s ease; }
        .vtx-grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:7px; margin-top:10px; }
        .vtx-mini { background:var(--ui-surface); border:1px solid #e2e8f0; border-radius:14px; padding:9px; min-height:58px; }
        .vtx-mini-label { font-size:10px; color:var(--ui-muted); font-weight:800; text-transform:uppercase; letter-spacing:.03em; }
        .vtx-mini-value { font-size:12px; color:var(--ui-ink); font-weight:900; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .vtx-timeline { display:grid; gap:8px; margin-top:11px; }
        .vtx-step { display:flex; align-items:flex-start; gap:9px; }
        .vtx-dot { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; flex-shrink:0; font-weight:900; }
        .vtx-step-title { font-size:12px; color:var(--ui-ink); font-weight:900; }
        .vtx-step-sub { font-size:11px; color:var(--ui-muted); margin-top:1px; line-height:1.3; }
        .vtx-panel { display:grid; gap:8px; margin-top:10px; }
        .vtx-panel-card { background:var(--ui-surface); border:1px solid #e2e8f0; border-radius:14px; padding:10px; font-size:12px; color:var(--ui-ink); }
        .vtx-system { display:flex; align-items:center; justify-content:center; margin:14px 0; }
        .vtx-system span { background:#f8fafc; border:1px solid #e2e8f0; color:var(--ui-muted); padding:6px 12px; border-radius:999px; font-size:11px; font-weight:800; box-shadow:0 4px 12px rgba(15,23,42,0.06); }
        @media (max-width: 520px) { .vtx-grid { grid-template-columns: repeat(3, minmax(0,1fr)); gap:6px; } .vtx-mini { padding:8px; min-height:54px; } .vtx-name { max-width: 170px; } .vtx-command { border-radius:16px; width: calc(100% - 10px); } }
    `;
    document.head.appendChild(style);
}

function newestDoc(docs, predicate) {
    const list = docs.filter(predicate).sort((a, b) => getDocMillis(a) - getDocMillis(b));
    return list.length ? list[list.length - 1] : null;
}

function getDocMillis(d) {
    return d?.createdAt?.toMillis?.() || 0;
}

function getLatestBookingCard(docs) {
    const cards = docs.filter(d => d.type === "booking_card");

    if (!cards.length) return null;

    function cardStatus(card) {
        return normalizeStatusText(card.bookingStatus || card.status || card.requestStatus || "pending");
    }

    function isFinalCard(card) {
        const st = cardStatus(card);
        return [
            "received",
            "fulfilled",
            "completed",
            "done",
            "archived",
            "feedback_done",
            "feedback_submitted",
            "rejected",
            "cancelled",
            "canceled"
        ].includes(st);
    }

    const activeCards = cards.filter(card => !isFinalCard(card));
    const targetCards = activeCards.length ? activeCards : cards;

    targetCards.sort((a, b) => getDocMillis(a) - getDocMillis(b));

    return targetCards[targetCards.length - 1];
}

function sameTransaction(d, transactionId, bookingId, bookingMessageId) {
    if (!d) return false;
    if (transactionId && d.transactionId === transactionId) return true;
    if (bookingId && d.bookingId === bookingId) return true;
    if (bookingId && d.transactionId === bookingId) return true;
    if (bookingMessageId && d.linkedBookingMessageId === bookingMessageId) return true;
    if (bookingId && d.linkedBookingId === bookingId) return true;
    if (d.type === "booking_card" && d.id === bookingMessageId) return true;
    return false;
}

function getActiveTransactionDocs(docs) {
    const activeBooking = getLatestBookingCard(docs);

    if (!activeBooking) return [];

    const transactionId = activeBooking.transactionId || activeBooking.bookingId || activeBooking.id;
    const bookingId = activeBooking.bookingId || activeBooking.transactionId || null;
    const bookingMessageId = activeBooking.id || null;

    const scoped = docs.filter(d => sameTransaction(d, transactionId, bookingId, bookingMessageId));

    return scoped.length ? scoped : [activeBooking];
}

function normalizeStatusText(status) {
    return String(status || "").toLowerCase();
}

function isDone(status, values) {
    return values.includes(normalizeStatusText(status));
}

function renderTimelineStep(done, active, icon, title, sub, color = "var(--ui-primary,#237e72)") {
    const bg = done ? "#dcfce7" : active ? "#fff7ed" : "#f1f5f9";
    const c = done ? "#166534" : active ? "#ea580c" : "#94a3b8";
    const symbol = done ? "✓" : active ? "…" : icon;
    return `
        <div class="vtx-step">
            <div class="vtx-dot" style="background:${bg}; color:${c}; border:1px solid ${done ? "#bbf7d0" : active ? "#fed7aa" : "#e2e8f0"};">${symbol}</div>
            <div>
                <div class="vtx-step-title">${escapeHtml(title)}</div>
                <div class="vtx-step-sub">${escapeHtml(sub)}</div>
            </div>
        </div>
    `;
}

function getTransactionState(docs) {
    const scopedDocs = getActiveTransactionDocs(docs);

    const booking = getLatestBookingCard(scopedDocs);
    const req = newestDoc(scopedDocs, d => d.type === "requirement_request");
    const resp = newestDoc(scopedDocs, d => d.type === "requirement_response");
    const completion = newestDoc(scopedDocs, d => d.type === "completion_request");
    const feedbackReq = newestDoc(scopedDocs, d => d.type === "feedback_request");
    const feedbackResp = newestDoc(scopedDocs, d => d.type === "feedback_response");

    const requestType = booking?.requestType || req?.requestType || resp?.requestType || "booking";
    const meta = getRequestMeta(requestType);
    const bookingStatus = booking?.bookingStatus || booking?.status || "pending";
    const txStatus = ["preparing", "out_for_delivery", "delivered", "received"].includes(bookingStatus) ? bookingStatus : completion?.transactionStatus || "";

    const accepted = isDone(bookingStatus, ["accepted", "payment_submitted", "payment_confirmed", "preparing", "ready", "out_for_delivery", "delivered", "fulfilled", "received"]) || !!req || !!resp || !!completion || !!feedbackReq || !!feedbackResp;
    const rejected = normalizeStatusText(bookingStatus) === "rejected";
    const detailsSubmitted = !!resp;
    const paymentConfirmed = booking ? window.PaymentPolicy.flow(booking).verified : false;
    const onlinePayment = booking ? window.PaymentPolicy.isOnline(booking) : false;
    const preparing = normalizeStatusText(txStatus) === "preparing";
    const outForDelivery = normalizeStatusText(txStatus) === "out_for_delivery";
    const delivered = isDone(txStatus, ["delivered", "received"]) || isDone(bookingStatus, ["delivered", "fulfilled", "received"]);
    const received = normalizeStatusText(txStatus) === "received" || normalizeStatusText(bookingStatus) === "received" || !!feedbackReq || !!feedbackResp;
    const feedbackDone = !!feedbackResp || normalizeStatusText(feedbackReq?.feedbackStatus) === "feedback_submitted";

    return { booking, req, resp, completion, feedbackReq, feedbackResp, requestType, meta, bookingStatus, txStatus, accepted, rejected, detailsSubmitted, paymentConfirmed, onlinePayment, preparing, outForDelivery, delivered, received, feedbackDone };
}

function progressPercent(state) {
    if (state.rejected) return 100;
    const isDelivery = state.meta.key === "delivery_order";
    const items = isDelivery
        ? [!!state.booking, state.accepted, state.detailsSubmitted, !state.onlinePayment || state.paymentConfirmed, state.delivered || state.outForDelivery || state.received, state.feedbackDone]
        : [!!state.booking, state.accepted, state.delivered || state.received, state.feedbackDone];
    const done = items.filter(Boolean).length;
    return Math.max(10, Math.round((done / items.length) * 100));
}

function renderOrderSummaryMini(state) {
    const source = state.resp || state.booking || {};
    const order = source.orderDetails || source.orderItems || source.bookingDetails || "";
    const pay = source.paymentMethod || state.req?.prefillPaymentMethod || "";
    const amount = source.paymentAmount || state.req?.amount || "";
    const address = [source.houseStreet, source.barangay, source.city, source.landmark].filter(Boolean).join(", ") || source.deliveryAddress || state.req?.prefillAddress || "";

    let html = `<div class="vtx-panel">`;

    if (order && state.meta.key !== "table_reservation") {
        html += `
            <div class="vtx-panel-card">
                <div style="font-weight:900; color:var(--ui-ink); margin-bottom:6px;">🧾 Order Summary</div>
                <div style="white-space:pre-wrap; line-height:1.45;">${escapeHtml(order)}</div>
            </div>
        `;
    }

    if (state.meta.key === "delivery_order" && address) {
        html += `
            <div class="vtx-panel-card">
                <div style="font-weight:900; color:var(--ui-ink); margin-bottom:6px;">📍 Delivery Card</div>
                <div data-no-translate>${escapeHtml(address)}</div>
                ${source.lat && source.lng ? `<button onclick="window.viewSharedLocation(${Number(source.lat)}, ${Number(source.lng)})" style="margin-top:8px; border:none; background:#dcfce7; color:#166534; padding:7px 10px; border-radius:9px; font-weight:800; cursor:pointer;">View Map</button>` : ""}
            </div>
        `;
    }

    const paymentRelevantTypes = ["pickup_order", "advance_order", "delivery_order"];
    const hasRealPaymentInfo = paymentRelevantTypes.includes(state.meta.key) && (pay || amount || source.paymentReference || state.paymentConfirmed || source.paymentStatus);

    if (hasRealPaymentInfo) {
        html += `
            <div class="vtx-panel-card">
                <div style="font-weight:900; color:var(--ui-ink); margin-bottom:6px;">💳 Payment Summary</div>
                ${pay ? `<div><b>Method:</b> ${escapeHtml(pay)}</div>` : ""}
                ${amount ? `<div><b>Amount:</b> ₱${escapeHtml(amount)}</div>` : ""}
                ${source.paymentReference ? `<div><b>Reference:</b> ${escapeHtml(source.paymentReference)}</div>` : ""}
                <div style="margin-top:5px;">${state.paymentConfirmed ? makeBadge("payment_confirmed") : makeBadge(source.paymentStatus || "pending_confirmation")}</div>
            </div>
        `;
    }

    html += `</div>`;
    return html === `<div class="vtx-panel"></div>` ? "" : html;
}

function buildVisibleTransactionSteps(state) {
    const meta = state.meta;
    const steps = [];

    steps.push(renderTimelineStep(true, false, "📅", "Request Sent", `${meta.shortLabel} created`, meta.color));

    if (state.rejected) {
        steps.push(renderTimelineStep(true, false, "✕", "Rejected", "Rejected by business", "#ef4444"));
        return steps.join("");
    }

    if (!state.accepted) {
        steps.push(renderTimelineStep(false, true, "○", "Waiting for Business", "Waiting for business acceptance", meta.color));
        return steps.join("");
    }

    steps.push(renderTimelineStep(true, false, "✓", "Accepted", "Accepted by business", meta.color));

    if (meta.key === "delivery_order") {
        if (!state.detailsSubmitted) {
            steps.push(renderTimelineStep(false, true, "📍", "Delivery Details", "Customer address, landmark, location, and payment details", meta.color));
            return steps.join("");
        }

        steps.push(renderTimelineStep(true, false, "📍", "Delivery Details", "Customer submitted delivery information", meta.color));

        if (state.onlinePayment && !state.paymentConfirmed) {
            steps.push(renderTimelineStep(false, true, "💳", "Payment Verification", "Waiting for business to confirm payment/reference", meta.color));
            return steps.join("");
        }

        if (state.onlinePayment) steps.push(renderTimelineStep(true, false, "💳", "Payment Verified", "Business verified the received payment", meta.color));
        else steps.push(renderTimelineStep(true, false, "💵", "Cash / COD", "Pay the business at pickup or delivery", meta.color));

        if (!state.preparing && !state.outForDelivery && !state.delivered && !state.received) {
            steps.push(renderTimelineStep(false, true, "🍳", "Preparing", "Waiting for business to prepare the order", meta.color));
            return steps.join("");
        }

        if (state.preparing) {
            steps.push(renderTimelineStep(false, true, "🍳", "Preparing", "Business is preparing the order", meta.color));
            return steps.join("");
        }

        steps.push(renderTimelineStep(true, false, "🍳", "Preparing", "Order preparation started", meta.color));

        if (state.outForDelivery) {
            steps.push(renderTimelineStep(false, true, "🛵", "Out for Delivery", "Order is on the way", meta.color));
            return steps.join("");
        }

        if (state.delivered || state.received) {
            steps.push(renderTimelineStep(true, false, "📦", "Delivered", "Business marked the order as delivered", meta.color));
        }

        if (state.delivered && !state.received) {
            steps.push(renderTimelineStep(false, true, "✅", "Customer Confirmation", "Waiting for customer to confirm received", meta.color));
            return steps.join("");
        }
    } else if (meta.key === "pickup_order") {
        if (state.onlinePayment && !state.paymentConfirmed) {
            steps.push(renderTimelineStep(false, true, "💳", "Payment / Order Check", "Waiting for business confirmation", meta.color));
            return steps.join("");
        }

        if (state.paymentConfirmed) {
            steps.push(renderTimelineStep(true, false, "💳", "Payment / Order Confirmed", "Business confirmed the order/payment details", meta.color));
        }

        if (!state.delivered && !state.received) {
            steps.push(renderTimelineStep(false, true, "🛍️", "Ready for Pickup", meta.fulfillLabel, meta.color));
            return steps.join("");
        }

        steps.push(renderTimelineStep(true, false, "🛍️", "Picked Up / Completed", "Customer pickup completed", meta.color));
    } else if (meta.key === "advance_order") {
        if (state.onlinePayment && !state.paymentConfirmed) {
            steps.push(renderTimelineStep(false, true, "💳", "Payment Required", "Waiting for business to verify payment/reference", meta.color));
            return steps.join("");
        }

        if (state.paymentConfirmed) {
            steps.push(renderTimelineStep(true, false, "💳", "Payment Verified", "Business confirmed payment", meta.color));
        }

        if (!state.delivered && !state.received) {
            steps.push(renderTimelineStep(false, true, "📅", "Scheduled / Preparing", meta.fulfillLabel, meta.color));
            return steps.join("");
        }

        steps.push(renderTimelineStep(true, false, "📦", "Completed", "Advance order completed", meta.color));
    } else {
        if (!state.delivered && !state.received) {
            const activeTitle = meta.key === "table_reservation" ? "Reservation Confirmed" : meta.key === "food_reservation" ? "Food Reserved" : "In Progress";
            steps.push(renderTimelineStep(false, true, "○", activeTitle, meta.fulfillLabel, meta.color));
            return steps.join("");
        }

        steps.push(renderTimelineStep(true, false, "📦", "Completed", meta.fulfillLabel, meta.color));
    }

    if (state.received && !state.feedbackDone) {
        steps.push(renderTimelineStep(false, true, "⭐", "Feedback", "Waiting for customer rating and review", meta.color));
        return steps.join("");
    }

    if (state.feedbackDone) {
        steps.push(renderTimelineStep(true, false, "⭐", "Feedback Done", "Customer rating and review submitted", meta.color));
    }

    return steps.join("");
}

function getTransactionCurrentLabel(state) {
    if (state.rejected) return "Rejected";
    if (state.feedbackDone) return "Feedback Done";
    if (state.received) return "Completed";
    if (state.delivered) return "Delivered";
    if (state.outForDelivery) return "Out for Delivery";
    if (state.preparing) return "Preparing";
    if (state.paymentConfirmed) return "Payment Verified";
    if (state.detailsSubmitted) return state.meta.key === "delivery_order" ? "Details Submitted" : "Order Details Submitted";
    if (state.accepted) return "Accepted";
    return "Pending";
}

function renderPaymentFlowCard(order, isOwner) {
    const flow = window.PaymentPolicy.flow(order);
    const status = order.bookingStatus || order.status || "pending";
    let title = "Confirm payment details in chat";
    let copy = "Agree on the final amount, delivery fee and payment method with the business before paying.";
    if (flow.closed) { title = "Payment flow closed"; copy = order.refundStatus ? "Follow the refund status in the current transaction summary." : "If you already paid, contact the business to arrange any applicable refund."; }
    else if (flow.online && status === "accepted" && !flow.termsReady) { title = "Waiting for payment instructions"; copy = "The business must set the amount and payment instructions first."; }
    else if (status === "pending") { title = "Wait for acceptance"; copy = "The business needs to accept your request and confirm the final total before you pay."; }
    else if (order.paymentReviewDecision === "declined" && status === "accepted") { title = "Payment details declined · Correction needed"; copy = "Your order is still accepted. Check the business note below and resubmit corrected details. Do not pay again unless you have agreed it is necessary."; }
    else if (flow.verified) { title = "Payment accepted by business"; copy = "The business manually checked your payment. Preparation and fulfillment are tracked separately."; }
    else if (flow.reviewing) { title = isOwner ? "Check payment before confirming" : "Payment details · Under review"; copy = isOwner ? "Match the amount and reference against money received in your account. A screenshot alone is not confirmation." : "The business will verify the payment against its account. Do not pay again while it is under review."; }
    else if (flow.online && ["preparing", "ready", "out_for_delivery", "delivered", "fulfilled", "received"].includes(status)) { title = "Check the recorded payment"; copy = "Confirm the payment status with the business. Do not make a second payment unless you have agreed it is needed."; }
    else if (flow.online) { title = "Pay directly to the business"; copy = "Confirm the total and recipient account in chat, pay using the agreed method, then upload your receipt. Vicinify does not collect the payment."; }
    else if (order.paymentMethod) { title = "Cash / pay on pickup or delivery"; copy = "Pay the agreed amount directly to the business at pickup or delivery. No online payment proof is needed."; }
    return `<section class="payment-flow-card"><span class="payment-flow-eyebrow">PAYMENT · ${order.paymentType ? escapeHtml(order.paymentType) + " · " : ""}${escapeHtml(order.paymentMethod || "Not yet agreed")}</span><h4>${title}</h4><p>${copy}</p>
        ${!isOwner && flow.awaitingProof ? `<button type="button" class="payment-proof-upload" onclick="window.uploadPaymentProof('${order.bookingId}', '${order.id}')"><i data-lucide="receipt"></i> Add payment reference / receipt</button>` : ""}
        ${order.paymentReviewDecision === "declined" && order.paymentReviewNote ? `<p class="payment-review-reason"><strong>Business note:</strong> ${escapeHtml(order.paymentReviewNote)}</p>` : ""}
        ${order.paymentReference ? `<dl class="payment-reference-summary"><div><dt>Reference</dt><dd>${escapeHtml(order.paymentReference)}</dd></div><div><dt>Amount submitted</dt><dd>₱${escapeHtml(order.paymentAmount || "—")}</dd></div></dl>` : ""}
        ${order.paymentType === "Downpayment" && !flow.closed ? `<p class="payment-balance-note">This is a downpayment. Agree on any remaining balance with the business; it is not marked paid in full.</p>` : ""}
        ${flow.online && !flow.closed ? `<div class="payment-flow-steps"><span>1. Pay business</span><span>2. Submit proof</span><span>3. Business verifies</span></div>` : ""}
    </section>`;
}
function renderBookingNextAction(order) {
    const status = order.bookingStatus || order.status || "pending";
    const delivery = ["delivery_order", "delivery"].includes(order.requestType);
    const next = window.PaymentPolicy.flow(order).canPrepare ? ["preparing", "Start preparing"]
        : status === "preparing" ? (delivery ? ["out_for_delivery", "Mark out for delivery"] : ["ready", "Mark ready"])
        : status === "ready" ? ["fulfilled", "Mark fulfilled"]
        : status === "out_for_delivery" ? ["delivered", "Mark delivered"] : null;
    return next ? `<button type="button" class="payment-stage-action" onclick="window.updateBookingFromChat('${order.bookingId}', '${order.id}', '${next[0]}')">${next[1]}</button>` : "";
}

function renderInlineTransactionProgress(docs) {
    const state = getTransactionState(docs);
    if (!state.booking && !state.req && !state.resp && !state.completion) return "";

    injectChatStyles();

    const meta = state.meta;
    const pct = progressPercent(state);
    const currentLabel = getTransactionCurrentLabel(state);
    const extraSummary = state.accepted || state.detailsSubmitted || state.paymentConfirmed || state.delivered || state.received || state.feedbackDone
        ? renderOrderSummaryMini(state)
        : "";

    return `
        <div class="vtx-command vtx-inline-progress" style="position:relative !important; top:auto !important; margin:12px 0 0 !important; box-shadow:none !important; border:1px solid #e2e8f0 !important;">
            <div class="vtx-command-head">
                <div class="vtx-title">
                    <div class="vtx-icon" style="background:${meta.color};">${meta.icon}</div>
                    <div style="min-width:0;">
                        <div class="vtx-name">${escapeHtml(meta.shortLabel)}</div>
                        <div class="vtx-sub">Transaction progress</div>
                    </div>
                </div>
                <div class="vtx-pill" style="background:${state.rejected ? "#fee2e2" : meta.light}; color:${state.rejected ? "#991b1b" : meta.dark};">${escapeHtml(currentLabel)}</div>
            </div>

            <div class="vtx-progress"><div class="vtx-progress-fill" style="width:${pct}%; background:${state.rejected ? "#ef4444" : meta.color};"></div></div>

            <div class="vtx-grid">
                <div class="vtx-mini"><div class="vtx-mini-label">Current</div><div class="vtx-mini-value">${escapeHtml(currentLabel)}</div></div>
                <div class="vtx-mini"><div class="vtx-mini-label">Type</div><div class="vtx-mini-value">${escapeHtml(meta.shortLabel)}</div></div>
                <div class="vtx-mini"><div class="vtx-mini-label">Progress</div><div class="vtx-mini-value">${pct}%</div></div>
            </div>

            <div class="vtx-timeline">${buildVisibleTransactionSteps(state)}</div>
            ${extraSummary}
        </div>
    `;
}

function renderSystemUpdate(d, dateStr) {
    return `
        <div class="vtx-system">
            <span>${escapeHtml(d.icon || "•")} ${escapeHtml(d.text || "Transaction updated")} • ${escapeHtml(dateStr)}</span>
        </div>
    `;
}

async function addSystemUpdate(placeId, placeName, userId, userName, text, stage, icon, transactionId = null, bookingId = null) {
    try {
        const payload = {
            placeId,
            placeName,
            userId,
            userName: userName || "Customer",
            type: "system_update",
            stage: stage || "info",
            icon: icon || "✅",
            text,
            senderUid: window.auth.currentUser.uid,
            senderRole: window.auth.currentUser.uid === userId ? "customer" : "owner",
            senderName: window.auth.currentUser.uid === userId ? userName : placeName,
            createdBy: window.auth.currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            reply: null
        };

        if (transactionId) payload.transactionId = transactionId;
        if (bookingId) payload.bookingId = bookingId;

        await window.ContentPolicy.create(window.db, 'messages', payload);
    } catch (e) {
        console.warn("System update skipped:", e);
    }
}

window.openChatModal = async function(placeId, placeName, customerUid = null, mode = "messages", bookingId = null) {
const user = window.auth?.currentUser;

if (!user) {
    window.alert("Please log in first to access the chat.");
    showPage("page-login");
    return;
}

if (!user.emailVerified) {
    const ans = await window.vConfirm(
        "Account Not Verified",
        "You must verify your email address to use the chat feature. Would you like us to resend the verification link?",
        "Resend Link",
        false
    );

    if (ans) window.resendVerificationEmail();
    return;
}

// Resolve this establishment's actual ownership before enabling customer prompts
// or subscribing to a thread. An account role alone does not identify the chat side.
const opening = window.__chatOpenGeneration = (window.__chatOpenGeneration || 0) + 1;
let placeData;
try {
    const placeDoc = await window.db.collection('places').doc(placeId).get();
    if(opening !== window.__chatOpenGeneration || window.auth?.currentUser?.uid !== user.uid)return;
    if(!placeDoc.exists) return window.showToast('This establishment is unavailable.','error');
    placeData = placeDoc.data();
} catch(error) {
    if(opening !== window.__chatOpenGeneration)return;
    console.error('Chat ownership lookup failed:',error);
    return window.showToast('Could not open this conversation. Please try again.','error');
}
const ownsPlace = placeData.owner_uid === user.uid;
const admin = AppState.userProfile?.role === 'admin' || user.uid === 'Z45NZhQTgsTUX79WJ5ksCH8N3c02';
const targetUid = customerUid || user.uid;
if(ownsPlace && targetUid === user.uid) {
    setupChatSuggestions(true);
    window.closeChatModal?.();
    window.showToast('Open a customer conversation from Business Hub → Messages.','info');
    showPage('page-dashboard');
    return;
}
const isOwnerView = targetUid !== user.uid;
if(isOwnerView && !ownsPlace && !admin)
    return window.showToast('You cannot open another customer’s conversation.','error');
if(placeData.accountDeleted&&mode!=='transaction')return window.showToast('This establishment is closed. Open your transaction history instead.','info');
placeName = placeData.name || placeName || 'Establishment';
document.getElementById('chatModal').dataset.autoReply=String(!isOwnerView && placeData.auto_reply_enabled===true);

document.getElementById('chatModal').dataset.mode=mode==='transaction'?'transaction':'messages';
const composer=document.getElementById('chatMessageInput');if(composer){const placeholder=mode==='transaction'?'Message about this transaction...':'Write a message...';composer.dataset.i18nPlaceholder=placeholder;composer.placeholder=window.LangManager?.translateKey?.(placeholder)||placeholder;}
let switcher=document.getElementById('chatModeSwitch');
if(!switcher){switcher=document.createElement('button');switcher.id='chatModeSwitch';switcher.type='button';switcher.className='chat-mode-switch';document.querySelector('#chatModal .chat-header-copy')?.append(switcher);}
if(switcher){switcher.textContent=window.LangManager?.translateKey?.(mode==='transaction'?'Open inquiries':'Open transactions')||(mode==='transaction'?'Open inquiries':'Open transactions');switcher.onclick=()=>window.openChatModal(placeId,placeName,targetUid,mode==='transaction'?'messages':'transaction',bookingId);}
const headerCopy=document.querySelector('#chatModal .chat-header-copy');
for(const [node,label] of [[headerCopy?.querySelector('.chat-header-eyebrow'),mode==='transaction'?'Transaction':'Inquiries'],[headerCopy?.querySelector('p'),mode==='transaction'?'Request, payment and progress':'Questions and messages']])if(node){node.dataset.i18n=label;node.textContent=window.LangManager?.translateKey?.(label)||label;}
document.getElementById("chatPlaceId").value = placeId;
document.getElementById("chatPlaceName").value = placeName || "Establishment";
document.getElementById("chatCustomerUid").value = targetUid;

const provisionalTitle = isOwnerView ? "Customer" : (placeName || "Establishment");
document.getElementById("chatModalTitle").innerText = provisionalTitle;
document.getElementById("chatModalAvatar").innerText = getInitial(provisionalTitle);

const chatInput = document.getElementById("chatMessageInput");
if (chatInput) chatInput.value = "";
window.clearChatPhoto?.();
setupChatSuggestions(isOwnerView);
setupChatComposer();

const reqBtn = document.getElementById("chatRequirementBtn");
if (reqBtn) {
    reqBtn.style.display = isOwnerView ? "inline-flex" : "none";
}

injectChatStyles();
updateChatQuickActions(isOwnerView, null);
document.getElementById("chatModal").classList.remove("hidden");
document.getElementById("chatModal").setAttribute("aria-hidden", "false");
if (!window.__chatScrollLocked) { window.__chatScrollLocked = true; window.lockBodyScroll?.(true); }
listenToChatRoom(placeId, targetUid, mode==='transaction'?bookingId:null);

// Resolve only the customer's display name in the background. The business name
// always comes from the place document, including when opened by its business.
if(isOwnerView) (async()=>{
    try {
        const name=await getCustomerDisplayName(targetUid);
        if(opening !== window.__chatOpenGeneration || document.getElementById('chatPlaceId')?.value!==placeId || document.getElementById('chatCustomerUid')?.value!==targetUid)return;
        document.getElementById('chatModalTitle').innerText=name;
        document.getElementById('chatModalAvatar').innerText=getInitial(name);
    }catch(error){console.error('Chat customer-name lookup failed:',error);}
})();

};

window.closeChatModal = function() {
window.__chatOpenGeneration = (window.__chatOpenGeneration || 0) + 1;
document.getElementById("chatModal").classList.add("hidden");
document.getElementById("chatModal").setAttribute("aria-hidden", "true");
if (window.__chatScrollLocked) { window.__chatScrollLocked = false; window.lockBodyScroll?.(false); }

if (currentChatUnsub) {
    currentChatUnsub();
    currentChatUnsub = null;
}

};

window.clearChatPhoto = function() {
    if (window.__chatPhotoPreviewUrl) URL.revokeObjectURL(window.__chatPhotoPreviewUrl);
    window.__chatPhotoPreviewUrl = null;
    const preview = document.getElementById('chatPhotoPreview');
    if (preview) { preview.hidden=true; preview.removeAttribute('src'); }
    const file = document.getElementById('chatPhotoFile');
    if(file) file.value = '';
    const state = document.getElementById('chatPhotoState');
    if(state) state.hidden = true;
    const name = document.getElementById('chatPhotoName');
    if(name) name.textContent = '';
};
if(!window.__chatPhotoPickerBound) {
    window.__chatPhotoPickerBound = true;
    document.addEventListener('change',event=>{
        if(event.target?.id !== 'chatPhotoFile') return;
        const file = event.target.files?.[0], state=document.getElementById('chatPhotoState');
        if(!file) return window.clearChatPhoto();
        if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5*1024*1024) {
            window.clearChatPhoto();
            window.showToast?.('Choose a JPG, PNG, or WebP under 5 MB.','error');
            return;
        }
        if (window.__chatPhotoPreviewUrl) URL.revokeObjectURL(window.__chatPhotoPreviewUrl);
        window.__chatPhotoPreviewUrl = URL.createObjectURL(file);
        const preview = document.getElementById('chatPhotoPreview');
        if (preview) { preview.src=window.__chatPhotoPreviewUrl; preview.hidden=false; }
        document.getElementById('chatPhotoName').textContent = '📷 '+file.name;
        if(state) state.hidden = false;
    });
}

window.sendChatMessage = async function(options = {}) {
if(window.__chatSending)return;
const user = window.auth?.currentUser;
if (!user) return;

const placeId = document.getElementById("chatPlaceId").value;
const placeName = document.getElementById("chatPlaceName").value;
const customerUid = document.getElementById("chatCustomerUid").value;
const input = document.getElementById("chatMessageInput");
const transactionMode=document.getElementById('chatModal')?.dataset.mode==='transaction';
const linkedBooking=transactionMode?document.getElementById('chatTransactionSummary')?.dataset.bookingId:null;
if(transactionMode&&window.PaymentPolicy?.conversationClosed?.(deskOrder(linkedBooking)||{}))return window.showToast?.('This transaction conversation is archived. You can read it in history.','info');
if(transactionMode&&!linkedBooking)return window.showToast?.('Choose a transaction before sending a message.','info');
const quickSend = typeof options.text === 'string';
const photoFile = quickSend ? null : document.getElementById('chatPhotoFile')?.files?.[0];
const draft = quickSend ? options.text.trim() : input.value.trim();
const text = draft || (photoFile ? 'Photo attachment' : '');

if (!text) return;
const contentError = window.ContentPolicy?.error('chat',text);
if (contentError) return window.alert(contentError);

// Quick questions preserve the current draft; typed sends clear immediately.
if(!quickSend){input.value = "";input.dispatchEvent(new Event("input", { bubbles: true }));}
window.__chatSending=true;
document.querySelectorAll('#chatSuggestions .chat-suggestion').forEach(button=>button.disabled=true);

try {
const inlinePhoto = photoFile ? await window.viciPhotoToInlineData(photoFile, 62000) : null;
const isOwner = user.uid !== customerUid;
const customerName = isOwner
    ? await getCustomerDisplayName(customerUid)
    : (AppState.userProfile?.fullName || user.displayName || "Customer");

const senderName = isOwner
    ? placeName
    : (AppState.userProfile?.fullName || user.displayName || "Customer");

const quickQuestion = !isOwner && !transactionMode ? window.ContentPolicy?.topicFor(text) : null;
    const messagePayload = {
        placeId,
        placeName,
        userId: customerUid,
        userName: customerName,
        type: "text",
        text,
        ...(inlinePhoto ? {photoData:inlinePhoto} : {}),
        ...(quickQuestion ? {quickQuestion} : {}),
        ...(linkedBooking ? {bookingId:linkedBooking,transactionId:linkedBooking} : {}),
        status: "sent",
        deliveredAt: null,
        seenAt: null,
        senderUid: user.uid,
        senderRole: isOwner ? "owner" : "customer",
        senderName,
        createdBy: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        reply: null
    };
    // Verification can change while an old ID token is still cached. Retry only
    // a rejected write, which Firestore commits atomically with its rate bucket.
    let messageRef;
    try { messageRef=await window.ContentPolicy.create(window.db,'messages',messagePayload); }
    catch(error) {
        if(!['permission-denied','firestore/permission-denied'].includes(error.code)||!user.emailVerified)throw error;
        await user.getIdToken(true);
        messageRef=await window.ContentPolicy.create(window.db,'messages',messagePayload);
    }
    if(photoFile) window.clearChatPhoto?.();
    if(quickQuestion && document.getElementById('chatModal').dataset.autoReply==='true') {
        window.ViciData.command('autoReply',{messageId:messageRef.id,topic:quickQuestion})
            .catch(error=>{
                console.warn('Automatic reply unavailable:',error.message);
                if(window.auth?.currentUser?.uid===user.uid && document.getElementById('chatPlaceId').value===placeId && !document.getElementById('chatModal').classList.contains('hidden'))
                    window.showToast('Question sent. Automatic reply is unavailable right now; the business can still respond.','info');
            });
    }
} catch (error) {
    console.error("sendChatMessage failed:", error);
    if(!quickSend && draft && !input.value.trim()){input.value = draft;input.dispatchEvent(new Event("input", { bubbles: true }));}
    if (window.vicinifyToast) window.vicinifyToast(['permission-denied','firestore/permission-denied'].includes(error.code)
        ? 'Message not sent. Check that your email is verified and the latest Firestore rules are deployed.'
        : "Message not sent: " + error.message, "error");
    else window.alert("Error sending message: " + error.message);
} finally {
    window.__chatSending=false;
    document.querySelectorAll('#chatSuggestions .chat-suggestion').forEach(button=>button.disabled=false);
}

};

document.addEventListener("DOMContentLoaded", setupChatComposer);

// Receipt images are optional; reference and amount are always reviewed manually.
async function compressPaymentReceipt(file) {
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) throw new Error("Choose an image under 8 MB.");
    return new Promise((resolve, reject) => {
        const img = new Image(), objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            let result = '';
            for(const [width,quality] of [[900,.75],[760,.67],[640,.59],[510,.5]]) {
                const scale=Math.min(1,width/Math.max(img.width,img.height));
                canvas.width=Math.max(1,Math.round(img.width*scale));
                canvas.height=Math.max(1,Math.round(img.height*scale));
                canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
                result=canvas.toDataURL('image/jpeg',quality);
                if(result.length<=600000)break;
            }
            if(result.length>600000)reject(new Error('Receipt too detailed for secure Firestore storage. Crop it or choose a smaller screenshot.'));
            else resolve(result);
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not read the receipt image.")); };
        img.src = objectUrl;
    });
}
window.uploadPaymentProof = async function(bookingId, messageId) {
    const user = window.auth?.currentUser;
    if (!user) return window.showToast?.("Please log in first.", "error");
    const existing = document.getElementById("paymentProofModal");
    if (existing) return existing.querySelector("input")?.focus();
    let order = deskOrder(bookingId);
    if (!order) {
        try {
            const doc = await window.db.collection("bookings").doc(bookingId).get();
            if (doc.exists) order = doc.data();
        } catch (error) { return window.showToast?.("Could not load payment details. Try again.", "error"); }
    }
    if (!order || !window.PaymentPolicy.flow(order).awaitingProof && !window.PaymentPolicy.flow(order).reviewing)
        return window.showToast?.("This request is not awaiting online payment details.", "info");
    if (document.getElementById("paymentProofModal")) return;
    const modal = document.createElement("div");
    modal.id = "paymentProofModal";
    modal.className = "req-modal manual-payment-modal";
    modal.innerHTML = `<div class="modalBackdrop req-backdrop"></div>
        <form class="req-sheet" role="dialog" aria-modal="true" aria-labelledby="manualPaymentTitle">
            <header class="req-head"><span class="req-head-icon"><i data-lucide="receipt"></i></span><div class="req-head-text"><h3 id="manualPaymentTitle">Payment details</h3><p>Enter your reference number. A receipt image is optional.</p></div><button type="button" class="req-close" aria-label="Close payment details"><i data-lucide="x"></i></button></header>
            <div class="req-body">
                <div class="req-note"><span>Paid directly to <strong data-no-translate>${escapeHtml(order.placeName || "the business")}</strong> via ${escapeHtml(order.paymentMethod)}. Submit only after you have made the payment.</span></div>
                ${order.paymentInstructions ? `<div class="manual-payment-instructions"><b>Amount due: ₱${escapeHtml(order.paymentAmountDue || '')}</b><p data-no-translate>${escapeHtml(order.paymentInstructions)}</p></div>` : ''}
                <div class="manual-payment-fields">
                    <label class="req-field"><span>Reference / transaction number *</span><input class="req-input" name="reference" required minlength="3" maxlength="80" autocomplete="off" placeholder="Enter the number from your payment receipt" value="${escapeHtml(order.paymentReference || "")}"></label>
                    <label class="req-field"><span>Amount paid (₱) *</span><input class="req-input" name="amount" required inputmode="decimal" autocomplete="off" placeholder="e.g. 588.00" value="${escapeHtml(order.paymentAmount || order.paymentAmountDue || "")}"></label>
                    <label class="req-field"><span>Receipt image <em>optional</em></span><input class="req-input payment-receipt-file" name="receipt" type="file" accept="image/*"><small class="manual-payment-help">JPEG, PNG or WebP · up to 8 MB</small></label>
                    <div class="manual-receipt-preview" hidden><img alt="Your selected payment receipt"><button type="button" class="remove-payment-receipt">Remove image</button></div>
                </div>
                <p class="manual-payment-help">Submitting a reference number does not mark your request paid. The business checks the amount and reference against funds actually received.</p>
                <p class="manual-payment-error" role="alert" hidden></p>
            </div>
            <footer class="req-footer"><button type="button" class="req-btn ghost payment-details-cancel">Cancel</button><button type="submit" class="req-btn primary">Submit for review</button></footer>
        </form>`;
    const previousFocus = document.activeElement;
    let busy = false, previewUrl = null;
    const form = modal.querySelector("form"), error = modal.querySelector(".manual-payment-error");
    const close = () => {
        if (busy) return;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        document.removeEventListener("keydown", onKey); modal.remove();
        const chat = document.getElementById("chatModal");
        if (!chat || chat.classList.contains("hidden")) window.lockBodyScroll?.(false);
        previousFocus?.focus?.();
    };
    const onKey = event => {
        if (event.key === "Escape") close();
        if (event.key === "Tab") {
            const items = [...form.querySelectorAll("button,input")].filter(el => !el.disabled && el.getClientRects().length);
            if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
            else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
        }
    };
    modal.querySelector(".req-close").onclick = close;
    modal.querySelector(".payment-details-cancel").onclick = close;
    modal.querySelector(".modalBackdrop").onclick = close;
    const receipt = form.elements.receipt, preview = modal.querySelector(".manual-receipt-preview");
    receipt.onchange = () => {
        if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
        preview.hidden = true; error.hidden = true;
        const file = receipt.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
            receipt.value = ""; error.textContent = "Choose an image under 8 MB."; error.hidden = false; return;
        }
        previewUrl = URL.createObjectURL(file); preview.querySelector("img").src = previewUrl; preview.hidden = false;
    };
    modal.querySelector(".remove-payment-receipt").onclick = () => { receipt.value = ""; receipt.onchange(); };
    form.onsubmit = async event => {
        event.preventDefault();
        if (busy || !form.reportValidity()) return;
        error.hidden = true;
        let payment;
        try { payment = window.PaymentPolicy.details(form.elements.reference.value, form.elements.amount.value); }
        catch (err) { error.textContent = err.message; error.hidden = false; return; }
        busy = true;
        const submit = form.querySelector('[type="submit"]'); submit.disabled = true; submit.textContent = "Submitting…";
        try {
            const payload = { bookingId, reference: payment.paymentReference, amount: payment.paymentAmount };
            if (receipt.files[0]) payload.image = await compressPaymentReceipt(receipt.files[0]);
            await window.ViciData.command("proof", payload);
            busy = false; close();
            window.showToast?.("Payment details submitted. Waiting for business verification.", "success");
        } catch (err) {
            error.textContent = "Could not submit payment details. " + err.message; error.hidden = false;
        } finally { busy = false; submit.disabled = false; submit.textContent = "Submit for review"; }
    };
    document.body.appendChild(modal); window.lockBodyScroll?.(true); document.addEventListener("keydown", onKey);
    window.debouncedIcons?.(); form.elements.reference.focus();
};

function requestPaymentCorrectionNote() {
    if (document.getElementById("paymentCorrectionModal")) return Promise.resolve(null);
    return new Promise(resolve => {
        const modal = document.createElement("div");
        modal.id = "paymentCorrectionModal"; modal.className = "req-modal";
        modal.innerHTML = `<div class="modalBackdrop req-backdrop"></div><form class="req-sheet" role="dialog" aria-modal="true" aria-labelledby="paymentCorrectionTitle">
            <header class="req-head"><span class="req-head-icon"><i data-lucide="receipt-text"></i></span><div class="req-head-text"><h3 id="paymentCorrectionTitle">Decline payment details?</h3><p>The order stays accepted. The customer can correct and resubmit their payment details.</p></div><button type="button" class="req-close" aria-label="Close payment review"><i data-lucide="x"></i></button></header>
            <div class="req-body"><label class="req-field"><span>Reason for declining *</span><textarea class="req-input req-textarea" name="reason" required minlength="5" maxlength="500" placeholder="For example: reference not found, amount does not match, or receipt is unclear."></textarea></label><p class="manual-payment-help">Explain what needs correcting. Do not ask the customer to pay again if you have already received the payment.</p></div>
            <footer class="req-footer"><button type="button" class="req-btn ghost">Keep reviewing</button><button type="submit" class="req-btn payment-review-decline">Decline payment</button></footer></form>`;
        const previousFocus = document.activeElement;
        const finish = value => {
            document.removeEventListener("keydown", onKey); modal.remove();
            const chat = document.getElementById("chatModal");
            if (!chat || chat.classList.contains("hidden")) window.lockBodyScroll?.(false);
            previousFocus?.focus?.(); resolve(value);
        };
        const form = modal.querySelector("form");
        const onKey = event => {
            if (event.key === "Escape") finish(null);
            if (event.key === "Tab") {
                const inputs = [...form.querySelectorAll("button,textarea")];
                if (event.shiftKey && document.activeElement === inputs[0]) { event.preventDefault(); inputs.at(-1).focus(); }
                else if (!event.shiftKey && document.activeElement === inputs.at(-1)) { event.preventDefault(); inputs[0].focus(); }
            }
        };
        modal.querySelector(".req-close").onclick = () => finish(null);
        modal.querySelector(".ghost").onclick = () => finish(null);
        modal.querySelector(".modalBackdrop").onclick = () => finish(null);
        form.onsubmit = event => { event.preventDefault(); if (!form.reportValidity()) return; const note = form.elements.reason.value.trim(); if (note.length < 5) { form.elements.reason.setCustomValidity("Explain the issue in at least 5 characters."); form.elements.reason.reportValidity(); return; } finish(note); };
        form.elements.reason.oninput = () => form.elements.reason.setCustomValidity("");
        document.body.appendChild(modal); window.lockBodyScroll?.(true); document.addEventListener("keydown", onKey); window.debouncedIcons?.(); form.elements.reason.focus();
    });
}
const paymentReviewsInFlight = new Set();
window.reviewPaymentProof = async function(bookingId, messageId, action) {
    if (!window.auth?.currentUser) return window.showToast?.("Please log in first.", "error");
    if (!["confirm", "resubmit"].includes(action) || paymentReviewsInFlight.has(bookingId)) return;
    paymentReviewsInFlight.add(bookingId);
    try {
        let note = null;
        if (action === "confirm") {
            if (!await window.vConfirm("Accept this payment?", "Check the actual money received, amount and reference in your account. Accepting confirms the payment only; preparation is a separate step.", "Accept payment")) return;
        } else {
            note = await requestPaymentCorrectionNote();
            if (!note) return;
        }
        const patch = { status: action === "confirm" ? "payment_confirmed" : "accepted" };
        if (note) patch.paymentReviewNote = note;
        await window.ViciData.command("booking", { bookingId, patch });
        window.showToast?.(action === "confirm" ? "Payment accepted. You can now start preparation." : "Payment declined. The customer can see your reason and resubmit.", "success");
    } catch (error) { window.showToast?.("Payment review was not saved. " + error.message, "error"); }
    finally { paymentReviewsInFlight.delete(bookingId); }
};

window.updateBookingFromChat = async function(bookingId, messageId, status) {
    const user = window.auth?.currentUser;

    try {
        const msgRef = messageId ? window.db.collection("messages").doc(messageId) : window.db.collection("bookings").doc(bookingId);
        // The open thread already rendered this card — reuse its data
        // (requestType/payment/address fields are set at send time).
        const cachedMsg = currentChatDocsCache.find(d => d.id === messageId) || deskOrder(bookingId);
        let msgData;
        if (cachedMsg) {
            msgData = cachedMsg;
        } else {
            const msgDoc = await msgRef.get();
            msgData = msgDoc.exists ? msgDoc.data() : {};
        }
        const requestType = String(msgData.requestType || "booking").toLowerCase();
        const transactionId = msgData.transactionId || bookingId || messageId;

        await window.ViciData.command("booking", { bookingId: bookingId, patch: {
            status,
            transactionId,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        } });


        // 🛵 DELIVERY SMART FLOW:
        // Kapag Delivery Order ang in-accept ng business, automatic lalabas yung delivery-ready card.
        // Customer can submit/confirm address, location, payment, and order details without owner manually clicking Request Requirements.
        if (status === "accepted" && requestType === "delivery_order" && msgData.paymentFlowVersion !== 2) {
            const existingDeliveryReq = await window.db.collection("messages").where("placeId", "==", msgData.placeId)
                .where("type", "==", "requirement_request")
                .where("bookingId", "==", bookingId)
                .where("autoGeneratedDelivery", "==", true)
                .limit(1)
                .get();

            if (existingDeliveryReq.empty) {
                const preferredPayment = msgData.paymentMethod || "GCash";
                const paymentOptions = Array.from(new Set([
                    preferredPayment,
                    "GCash",
                    "Maya",
                    "Bank Transfer",
                    "Others",
                    "Cash on Delivery if allowed"
                ].filter(Boolean)));

                await window.ContentPolicy.create(window.db, 'messages', {
                    placeId: msgData.placeId,
                    placeName: msgData.placeName,
                    userId: msgData.userId,
                    userName: msgData.userName || "Customer",
                    type: "requirement_request",
                    requestType: "delivery_order",
                    transactionId,
                    bookingId,
                    linkedBookingMessageId: messageId,
                    autoGeneratedDelivery: true,
                    requirements: {
                        address: true,
                        location: true,
                        // Payment proof has its own canonical, owner-reviewed booking action.
                        payment: false,
                        orderDetails: true
                    },
                    prefillAddress: msgData.deliveryAddress || "",
                    prefillOrderItems: msgData.orderItems || "",
                    prefillPaymentMethod: preferredPayment,
                    amount: "",
                    acceptedPaymentMethods: paymentOptions,
                    notes: "Delivery accepted. Submit your address, landmark and location here. Payment is handled separately in the current transaction summary.",
                    requirementStatus: "waiting_customer",
                    text: "Delivery order accepted. Customer can now submit delivery details.",
                    senderUid: user?.uid || "business",
                    senderRole: "owner",
                    senderName: msgData.placeName || "Business",
                    createdBy: user?.uid || "business",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    reply: null
                });
            }
        }

        const systemText = status === "accepted"
            ? (requestType === "delivery_order" ? "Delivery request accepted. Delivery details are ready." : "Request accepted by business.")
            : status === "rejected"
                ? "Request rejected by business."
                : status === "fulfilled"
                    ? "Business marked this request as fulfilled."
                    : "Request status updated: " + status;

        await addSystemUpdate(msgData.placeId, msgData.placeName, msgData.userId, msgData.userName, systemText, status, status === "accepted" ? "✅" : status === "rejected" ? "❌" : "📦", transactionId, bookingId);

        if (status === "accepted" && requestType === "delivery_order") {
            window.alert("Delivery request accepted. Delivery details card is now ready for the customer.");
        } else {
            window.alert("Request " + status + " successfully.");
        }
    } catch (error) {
        window.alert("Error updating request: " + error.message);
    }

};

window.confirmReceivedFromChat = async function(bookingId, messageId, placeId) {
const user = window.auth?.currentUser;
if (!user) return;

const ans = await window.vConfirm(
    "Confirm Received",
    "Confirm that you already received or completed this transaction?",
    "Confirm Received",
    false
);

if (!ans) return;

try {
    const transactionId = bookingId || messageId;

    await window.ViciData.command("booking", { bookingId: bookingId, patch: {
        status: "received",
        customer_confirmed: true,
        customerConfirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    } });


    const existingFeedback = await window.db.collection("messages")
        .where("type", "==", "feedback_request")
        .where("bookingId", "==", bookingId)
        .where("userId", "==", user.uid)
        .limit(1)
        .get();

    if (existingFeedback.empty) {
        const placeName = await getPlaceDisplayName(placeId, "Establishment");

        await window.ContentPolicy.create(window.db, 'messages', {
            placeId,
            placeName,
            userId: user.uid,
            userName: AppState.userProfile?.fullName || user.displayName || "Customer",
            type: "feedback_request",
            transactionId,
            bookingId,
            feedbackStatus: "feedback_waiting",
            text: "Please rate and send feedback for this completed transaction.",
            senderUid: user.uid,
            senderRole: "customer",
            senderName: "Vicinify",
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            reply: null
        });
    }

    await addSystemUpdate(placeId, await getPlaceDisplayName(placeId, "Establishment"), user.uid, AppState.userProfile?.fullName || user.displayName || "Customer", "Customer confirmed the transaction as received/completed.", "received", "📦", transactionId, bookingId);

    window.alert("Transaction confirmed. Please leave a rating and feedback.");
} catch (error) {
    window.alert("Error confirming received: " + error.message);
}

};

window.openRequirementRequestModal = function() {
const user = window.auth?.currentUser;
if (!user) return window.alert("Please log in first.");

const placeId = document.getElementById("chatPlaceId").value;
const placeName = document.getElementById("chatPlaceName").value;
const customerUid = document.getElementById("chatCustomerUid").value;

if (!customerUid || user.uid === customerUid) {
    return window.alert("Only the business owner can request requirements from a customer.");
}

const modalId = "reqRequestModal_" + Date.now();
window.lockBodyScroll(true);

const html = `
    <div id="${modalId}" class="req-modal">
        <div class="modalBackdrop req-backdrop"></div>
        <div class="req-sheet" role="dialog" aria-modal="true" aria-label="Request Requirements">
            <div class="req-head">
                <div class="req-head-icon"><i data-lucide="clipboard-list"></i></div>
                <div class="req-head-text">
                    <h3>Request Requirements</h3>
                    <p>Choose what the customer needs to submit for this transaction.</p>
                </div>
                <button type="button" id="closeX_${modalId}" class="req-close" aria-label="Close"><i data-lucide="x"></i></button>
            </div>

            <div class="req-body">
            <div class="req-options">
                <label class="req-option">
                    <input id="reqAddress_${modalId}" type="checkbox" checked>
                    <span class="req-opt-icon orange"><i data-lucide="home"></i></span>
                    <span class="req-opt-text"><b>Delivery Address</b><small>House no., barangay, city &amp; landmark</small></span>
                    <span class="req-opt-check"><i data-lucide="check"></i></span>
                </label>
                <label class="req-option">
                    <input id="reqLocation_${modalId}" type="checkbox">
                    <span class="req-opt-icon green"><i data-lucide="map-pin"></i></span>
                    <span class="req-opt-text"><b>Current Location</b><small>Customer attaches their current location</small></span>
                    <span class="req-opt-check"><i data-lucide="check"></i></span>
                </label>
                <label class="req-option">
                    <input id="reqOrder_${modalId}" type="checkbox">
                    <span class="req-opt-icon purple"><i data-lucide="clipboard-pen"></i></span>
                    <span class="req-opt-text"><b>Order Details</b><small>Items, quantity &amp; special instructions</small></span>
                    <span class="req-opt-check"><i data-lucide="check"></i></span>
                </label>
            </div>

            <p id="reqHint_${modalId}" class="req-hint" hidden>Please select at least one requirement above.</p>

            <div class="req-fields">
                <label class="req-field"><span>Instructions <em>optional</em></span>
                    <textarea id="reqNotes_${modalId}" class="req-input req-textarea" placeholder="Explain which details the customer should provide."></textarea>
                </label>
            </div>

            </div>
            <div class="req-footer">
                <button type="button" id="cancel_${modalId}" class="req-btn ghost">Cancel</button>
                <button type="button" id="send_${modalId}" class="req-btn primary"><i data-lucide="send"></i> Send Request</button>
            </div>
        </div>
    </div>
`;

document.body.insertAdjacentHTML("beforeend", html);

const modal = document.getElementById(modalId);
window.LangManager?.translateDOM?.(undefined,modal);
const close = () => { if(modal.dataset.submitting==='true'||!modal.isConnected)return;window.lockBodyScroll(false); modal.remove(); };

document.getElementById(`cancel_${modalId}`).onclick = close;
const _closeX = document.getElementById(`closeX_${modalId}`); if (_closeX) _closeX.onclick = close;
modal.querySelector(".modalBackdrop").onclick = close;
const contextOrder=deskOrder(chatDeskSelected);
if(contextOrder&&contextOrder.placeId===placeId&&contextOrder.userId===customerUid){
    modal.classList.add('requirements-only');
    if(contextOrder.requestType==='table_reservation'){
        for(const key of ['reqAddress','reqLocation']){const field=document.getElementById(`${key}_${modalId}`);if(field){field.checked=false;field.disabled=true;field.closest('label').hidden=true;}}
        const field=document.getElementById(`reqOrder_${modalId}`);if(field){field.closest('label').querySelector('b').textContent='Additional reservation details';field.closest('label').querySelector('small').textContent='Only ask for information missing from the reservation.';}
    }
    // New menu-based transactions have immutable food choices. Businesses may
    // request delivery details, but may not ask the customer to type new food.
    if(Array.isArray(contextOrder.menuLines)||contextOrder.tableId){
        const orderInput=document.getElementById(`reqOrder_${modalId}`);
        if(orderInput){orderInput.checked=false;orderInput.disabled=true;orderInput.closest('label').hidden=true;}
    }
    const notes=document.getElementById(`reqNotes_${modalId}`);notes.closest('label').querySelector('span').textContent='Instructions (optional)';notes.placeholder='Explain which details the customer should provide.';
}
window.LangManager?.translateDOM?.(undefined,modal);
window.debouncedIcons?.();

document.getElementById(`send_${modalId}`).onclick = async () => {
    if(modal.dataset.submitting==='true')return;
    const requirements = {
        address: document.getElementById(`reqAddress_${modalId}`).checked,
        location: document.getElementById(`reqLocation_${modalId}`).checked,
        payment: false,
        orderDetails: document.getElementById(`reqOrder_${modalId}`).checked
    };

    if (!requirements.address && !requirements.location && !requirements.payment && !requirements.orderDetails) {
        const hint = document.getElementById(`reqHint_${modalId}`); if (hint) { hint.hidden = false; hint.scrollIntoView({behavior:"smooth", block:"center"}); }
        return window.alert("Please select at least one requirement.");
    }

    const amount = '', mops = '';
    const notes = document.getElementById(`reqNotes_${modalId}`).value.trim();

    const linkedOrder=deskOrder(chatDeskSelected) || chatDeskOrders.find(d=>d.placeId===placeId&&d.userId===customerUid);
    modal.dataset.submitting='true';document.getElementById(`send_${modalId}`).disabled=true;
    try {
        if(linkedOrder&&linkedOrder.placeId===placeId&&linkedOrder.userId===customerUid){
            await window.ViciData.command('booking',{bookingId:linkedOrder.bookingId||linkedOrder.id,patch:{requirements:{action:'request',required:requirements,notes}}});
            modal.dataset.submitting='false';close();return window.alert('Requirement request sent.');
        }
        await window.ContentPolicy.create(window.db, 'messages', {
            bookingId:linkedOrder?.bookingId || linkedOrder?.id || null,
            transactionId:linkedOrder?.bookingId || linkedOrder?.id || null,
            placeId,
            placeName,
            userId: customerUid,
            userName: await getCustomerDisplayName(customerUid),
            type: "requirement_request",
            status: "sent",
            requirements,
            amount,
            acceptedPaymentMethods: splitPaymentMethods(mops),
            notes,
            requirementStatus: "waiting_customer",
            text: "Business requested transaction requirements.",
            senderUid: user.uid,
            senderRole: "owner",
            senderName: placeName,
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            reply: null
        });

        modal.dataset.submitting="false";close();
        window.alert("Requirement request sent.");
    } catch (error) {
        window.alert("Error sending request: " + error.message);
    } finally {modal.dataset.submitting='false';const button=document.getElementById(`send_${modalId}`);if(button)button.disabled=false;}
};

};

window.openRequirementResponseModal = async function(requestMessageId) {
const user = window.auth?.currentUser;
if (!user) return window.alert("Please log in first.");

try {
    const requestDoc = await window.db.collection("messages").doc(requestMessageId).get();
    if (!requestDoc.exists) return window.alert("Requirement request no longer exists.");

    const req = requestDoc.data();
    const requirements = {...(req.requirements || {})};
    if(requirements.payment){
        // Payments use the booking endpoint, never a second independent requirements status.
        requirements.payment=false;
        if(!requirements.address&&!requirements.location&&!requirements.orderDetails){
            const linked=req.bookingId || req.transactionId;
            if(linked&&deskOrder(linked))return window.uploadPaymentProof(linked,'');
            return window.alert("Use the current transaction summary to submit payment details.");
        }
    }
    const modalId = "reqResponseModal_" + Date.now();
window.lockBodyScroll(true);

    const paymentMethods = req.acceptedPaymentMethods && req.acceptedPaymentMethods.length
        ? req.acceptedPaymentMethods
        : ["GCash", "Maya", "Cash", "Cash on Delivery", "Bank Transfer", "Pay upon Pickup", "Other"];

    const prefillPaymentOption = req.prefillPaymentMethod
        ? `<option value="${escapeHtml(req.prefillPaymentMethod)}" selected>${escapeHtml(req.prefillPaymentMethod)} (from request)</option>`
        : "";

    const methodOptions = prefillPaymentOption + paymentMethods
        .filter(m => String(m) !== String(req.prefillPaymentMethod || ""))
        .map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`)
        .join("");

    const html = `
        <div id="${modalId}" class="req-modal">
            <div class="modalBackdrop req-backdrop"></div>
            <div class="req-sheet req-sheet-scroll" role="dialog" aria-modal="true" aria-label="Submit Requirements">
                <div class="req-head">
                    <div class="req-head-icon green"><i data-lucide="file-check-2"></i></div>
                    <div class="req-head-text">
                        <h3>Submit Requirements</h3>
                        <p>Fill out the information the business requested.</p>
                    </div>
                    <button type="button" id="closeX_${modalId}" class="req-close" aria-label="Close"><i data-lucide="x"></i></button>
                </div>

                <div class="req-body">
                ${req.notes ? `
                    <div class="req-note"><i data-lucide="message-square-text"></i><span ${req.autoGeneratedDelivery ? "" : "data-no-translate"}>${escapeHtml(req.notes)}</span></div>
                ` : ""}

                ${requirements.address ? `
                    <div class="req-section">
                        <div class="req-section-head"><span class="req-opt-icon orange"><i data-lucide="home"></i></span><b>Delivery Address</b></div>
                        <label class="req-field"><span>House number, street or subdivision *</span><input id="resHouse_${modalId}" value="${escapeHtml(req.prefillAddress || "")}" placeholder="House no. / Street / Subdivision" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:10px;"></label>
                        <label class="req-field"><span>Barangay *</span><input id="resBarangay_${modalId}" placeholder="Barangay" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                        <label class="req-field"><span>City / municipality *</span><input id="resCity_${modalId}" placeholder="City / Municipality" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                        <label class="req-field"><span>Landmark or location notes *</span><input id="resLandmark_${modalId}" placeholder="Landmark / Location notes e.g., tabi ng red na bahay, malapit sa kanto, blue gate" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                    </div>
                ` : ""}

                ${requirements.location ? `
                    <div class="req-section">
                        <div class="req-section-head"><span class="req-opt-icon green"><i data-lucide="map-pin"></i></span><b>Current Location</b></div>
                        <p id="locStatus_${modalId}" style="font-size:12px; color:var(--ui-muted);">Location not attached yet.</p>
                        <input id="resLat_${modalId}" type="hidden">
                        <input id="resLng_${modalId}" type="hidden">
                        <button type="button" id="getLoc_${modalId}" class="req-loc-btn"><i data-lucide="locate-fixed"></i> Attach My Current Location</button>
                    </div>
                ` : ""}

                ${requirements.payment ? `
                    <div class="req-section">
                        <div class="req-section-head"><span class="req-opt-icon blue"><i data-lucide="credit-card"></i></span><b>Payment Details</b></div>

                        ${req.amount ? `<div style="margin-top:8px; font-size:13px;"><b>Amount Requested:</b> ₱${escapeHtml(req.amount)}</div>` : ""}

                        <label class="req-field"><span>Payment method</span><select id="resPaymentMethod_${modalId}" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:10px;">
                            ${methodOptions}
                        </select></label>

                        <label class="req-field" id="customMopField_${modalId}" hidden><span>Other payment method</span><input id="resCustomMop_${modalId}" placeholder="If Other, type mode of payment" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                        <label class="req-field"><span>Amount paid</span><input id="resAmount_${modalId}" inputmode="decimal" placeholder="Amount paid" value="${escapeHtml(req.amount || "")}" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                        <label class="req-field"><span>Reference number / payment notes</span><input id="resRef_${modalId}" placeholder="Reference no. / Notes, optional for Cash/COD" class="req-input" style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #cbd5e1; border-radius:10px; margin-top:8px;"></label>
                    </div>
                ` : ""}

                ${requirements.orderDetails ? `
                    <div class="req-section">
                        <div class="req-section-head"><span class="req-opt-icon purple"><i data-lucide="clipboard-pen"></i></span><b>Additional Details</b></div>
                        <label class="req-field"><span>Items, quantity and instructions *</span><textarea id="resOrder_${modalId}" placeholder="Example: items, quantity, special instructions" class="req-input req-textarea" style="width:100%; box-sizing:border-box; min-height:80px; padding:10px; border:1px solid #cbd5e1; border-radius:10px; resize:none; margin-top:10px;">${escapeHtml(req.prefillOrderItems || "")}</textarea></label>
                    </div>
                ` : ""}

                </div>
                <div class="req-footer">
                    <button type="button" id="cancel_${modalId}" class="req-btn ghost">Cancel</button>
                    <button type="button" id="submit_${modalId}" class="req-btn primary"><i data-lucide="check"></i> Submit</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    const modal = document.getElementById(modalId);
    const close = () => { if(modal.dataset.submitting==='true'||!modal.isConnected)return;window.lockBodyScroll(false); modal.remove(); };

    document.getElementById(`cancel_${modalId}`).onclick = close;
    const _closeX2 = document.getElementById(`closeX_${modalId}`); if (_closeX2) _closeX2.onclick = close;
    modal.querySelector(".modalBackdrop").onclick = close;
    window.debouncedIcons?.();

    if (requirements.payment) {
        const method = document.getElementById(`resPaymentMethod_${modalId}`);
        const customField = document.getElementById(`customMopField_${modalId}`);
        const syncMethod = () => { customField.hidden = method.value !== "Other"; };
        method.addEventListener("change", syncMethod);
        syncMethod();
    }

    if (requirements.location) {
        document.getElementById(`getLoc_${modalId}`).onclick = () => {
            if (!navigator.geolocation) {
                return window.alert("Location sharing is not supported on this device.");
            }

            document.getElementById(`locStatus_${modalId}`).textContent = "Getting location...";

            navigator.geolocation.getCurrentPosition(async position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                document.getElementById(`resLat_${modalId}`).value = lat;
                document.getElementById(`resLng_${modalId}`).value = lng;
                const statusEl = document.getElementById(`locStatus_${modalId}`);
                statusEl.textContent = "Attached — identifying address...";

                // Identify the readable address and prefill the delivery
                // fields (empty fields only — never overwrite typing).
                const geo = window.reverseGeocode ? await window.reverseGeocode(lat, lng) : null;
                if (geo && geo.label) {
                    statusEl.textContent = `Attached: ${geo.label}`;
                    const fillIfEmpty = (id, val) => {
                        const el = document.getElementById(id);
                        if (el && val && !el.value.trim()) el.value = val;
                    };
                    fillIfEmpty(`resHouse_${modalId}`, geo.road);
                    fillIfEmpty(`resBarangay_${modalId}`, geo.barangay ? `Brgy. ${geo.barangay}` : "");
                    fillIfEmpty(`resCity_${modalId}`, geo.city);
                } else {
                    statusEl.textContent = `Attached: ${lat}, ${lng}`;
                }
            }, () => {
                document.getElementById(`locStatus_${modalId}`).textContent = "Unable to get location.";
                window.alert("Unable to get location. Please allow location permission.");
            }, {
                enableHighAccuracy: true,
                timeout: 10000
            });
        };
    }

    document.getElementById(`submit_${modalId}`).onclick = async () => {
        const payload = {
            placeId: req.placeId,
            placeName: req.placeName,
            userId: user.uid,
            userName: AppState.userProfile?.fullName || user.displayName || "Customer",
            type: "requirement_response",
            requestType: req.requestType || "booking",
            transactionId: req.transactionId || req.bookingId || requestMessageId,
            bookingId: req.bookingId || null,
            requestMessageId,
            requirementStatus: "submitted",
            requirements,
            text: "Customer submitted transaction requirements.",
            senderUid: user.uid,
            senderRole: "customer",
            senderName: AppState.userProfile?.fullName || user.displayName || "Customer",
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            reply: null
        };

        if (requirements.address) {
            payload.houseStreet = document.getElementById(`resHouse_${modalId}`).value.trim();
            payload.barangay = document.getElementById(`resBarangay_${modalId}`).value.trim();
            payload.city = document.getElementById(`resCity_${modalId}`).value.trim();
            payload.landmark = document.getElementById(`resLandmark_${modalId}`).value.trim();

            if (!payload.houseStreet || !payload.barangay || !payload.city || !payload.landmark) {
                return window.alert("Please complete the delivery address, city, and landmark/location notes.");
            }
        }

        if (requirements.location) {
            const lat = document.getElementById(`resLat_${modalId}`).value;
            const lng = document.getElementById(`resLng_${modalId}`).value;

            if (!lat || !lng) {
                return window.alert("Please attach your current location.");
            }

            payload.lat = Number(lat);
            payload.lng = Number(lng);
        }

        if (requirements.payment) {
            const selectedMethod = document.getElementById(`resPaymentMethod_${modalId}`).value;
            const customMop = document.getElementById(`resCustomMop_${modalId}`).value.trim();

            payload.paymentMethod = selectedMethod === "Other" ? customMop : selectedMethod;
            payload.paymentAmount = document.getElementById(`resAmount_${modalId}`).value.trim();
            payload.paymentReference = document.getElementById(`resRef_${modalId}`).value.trim();
            payload.paymentStatus = "pending_confirmation";

            if (!payload.paymentMethod) {
                return window.alert("Please select a payment method.");
            }

            if (req.amount && !payload.paymentAmount) {
                return window.alert("Please enter the amount paid.");
            }

            const onlinePayment = window.PaymentPolicy.isOnline({ paymentMethod: payload.paymentMethod });
            if (onlinePayment && !payload.paymentReference) {
                return window.alert("Please enter your online payment reference number so the business can verify it.");
            }
        }

        if (requirements.orderDetails) {
            payload.orderDetails = document.getElementById(`resOrder_${modalId}`).value.trim();

            if (!payload.orderDetails) {
                return window.alert("Please enter additional details.");
            }
        }

        if(modal.dataset.submitting==='true')return;
        modal.dataset.submitting='true';document.getElementById(`submit_${modalId}`).disabled=true;
        try {
            if(req.canonicalRequirements&&req.bookingId){
                await window.ViciData.command('booking',{bookingId:req.bookingId,patch:{requirements:{action:'submit',requestId:requestMessageId,data:payload}}});
                modal.dataset.submitting='false';close();return window.alert('Requirements submitted.');
            }
            await window.ContentPolicy.create(window.db, 'messages', payload);

            await window.db.collection("messages").doc(requestMessageId).update({
                requirementStatus: "submitted",
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await addSystemUpdate(req.placeId, req.placeName, user.uid, AppState.userProfile?.fullName || user.displayName || "Customer", "Customer submitted the requested transaction details.", "submitted", "📍", req.transactionId || req.bookingId || requestMessageId, req.bookingId || null);

            modal.dataset.submitting="false";close();
            window.alert("Requirements submitted.");
        } catch (error) {
            window.alert("Error submitting requirements: " + error.message);
        } finally {modal.dataset.submitting="false";const button=document.getElementById(`submit_${modalId}`);if(button)button.disabled=false;}
    };
} catch (error) {
    window.alert("Error opening requirement form: " + error.message);
}

};

window.confirmRequirementResponse = async function(responseMessageId) {
    const user = window.auth?.currentUser;
    if (!user) return;

    const ans = await window.vConfirm(
        "Confirm Requirements",
        "Confirm that the submitted details are correct? This does not confirm payment or mark the order as fulfilled.",
        "Confirm",
        false
    );

    if (!ans) return;

    try {
        const responseDoc = await window.db.collection("messages").doc(responseMessageId).get();

        if (!responseDoc.exists) {
            return window.alert("Requirement response no longer exists.");
        }

        const responseData = responseDoc.data();
        const transactionId = responseData.transactionId || responseData.bookingId || responseMessageId;
        if(responseData.canonicalRequirements&&responseData.bookingId){
            await window.ViciData.command('booking',{bookingId:responseData.bookingId,patch:{requirements:{action:'confirm',requestId:responseData.requestMessageId,responseId:responseMessageId}}});
            return window.alert('Details confirmed. Payment verification is separate.');
        }
        await window.db.collection("messages").doc(responseMessageId).update({
            requirementStatus: "confirmed",
            confirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await addSystemUpdate(responseData.placeId, responseData.placeName, responseData.userId, responseData.userName,
            "Requirements confirmed. Payment verification and order preparation are separate steps.", "confirmed", "📋", transactionId, responseData.bookingId || null);
        window.alert("Requirements confirmed. Verify online payment proof before starting preparation.");
    } catch (error) {
        window.alert("Error confirming requirements: " + error.message);
    }
};

window.updateTransactionStage = async function(completionMessageId, nextStatus) {
    const user = window.auth?.currentUser;
    if (!user) return;

    const labels = {
        preparing: "Preparing",
        out_for_delivery: "Out for Delivery",
        delivered: "Delivered"
    };

    const ans = await window.vConfirm(
        labels[nextStatus] || "Update Transaction",
        "Update this delivery status to " + (labels[nextStatus] || nextStatus) + "?",
        "Update",
        false
    );

    if (!ans) return;

    try {
        const ref = window.db.collection("messages").doc(completionMessageId);
        const doc = await ref.get();
        const data = doc.exists ? doc.data() : {};

        if (!data.bookingId) throw new Error("No linked booking was found. Open the booking transaction instead.");
        await window.ViciData.command("booking", { bookingId: data.bookingId, patch: { status: nextStatus } });
        await ref.update({ transactionStatus: nextStatus, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });

        const text = nextStatus === "out_for_delivery"
            ? "Order is now out for delivery."
            : nextStatus === "delivered"
                ? "Business marked the order as delivered. Waiting for customer confirmation."
                : "Business is preparing the order.";

        await addSystemUpdate(data.placeId, data.placeName, data.userId, data.userName, text, nextStatus, nextStatus === "out_for_delivery" ? "🛵" : nextStatus === "delivered" ? "📦" : "👨‍🍳", data.transactionId || data.bookingId || completionMessageId, data.bookingId || null);

        window.alert("Delivery status updated.");
    } catch (error) {
        window.alert("Error updating delivery status: " + error.message);
    }
};

window.confirmTransactionReceived = async function(completionMessageId, placeId, bookingId) {
    const user = window.auth?.currentUser;
    if (!user) return;

    const ans = await window.vConfirm(
        "Confirm Received",
        "Confirm that you received the order/service and the transaction is completed?",
        "Confirm Received",
        false
    );

    if (!ans) return;

    try {
        const completionDoc = await window.db.collection("messages").doc(completionMessageId).get();
        const completionData = completionDoc.exists ? completionDoc.data() : {};
        const transactionId = completionData.transactionId || bookingId || completionMessageId;


        if (bookingId && bookingId !== "null" && bookingId !== "undefined") {
            await window.ViciData.command("booking", { bookingId: bookingId, patch: {
                status: "received",
                customer_confirmed: true,
                customerConfirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            } });
        }

        await window.db.collection("messages").doc(completionMessageId).update({
            transactionStatus: "received",
            customerConfirmedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        const existingFeedback = await window.db.collection("messages")
            .where("type", "==", "feedback_request")
            .where("completionMessageId", "==", completionMessageId)
            .where("userId", "==", user.uid)
            .limit(1)
            .get();

        let feedbackMessageId = null;

        if (existingFeedback.empty) {
            const placeName = await getPlaceDisplayName(placeId, "Establishment");
            const feedbackRef = window.db.collection("messages").doc();

            await feedbackRef.set({
                placeId,
                placeName,
                userId: user.uid,
                userName: AppState.userProfile?.fullName || user.displayName || "Customer",
                type: "feedback_request",
                transactionId,
                completionMessageId,
                bookingId: bookingId || null,
                feedbackStatus: "feedback_waiting",
                text: "Please rate and send feedback for this completed transaction.",
                senderUid: user.uid,
                senderRole: "customer",
                senderName: "Vicinify",
                createdBy: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                reply: null
            });

            feedbackMessageId = feedbackRef.id;
        } else {
            feedbackMessageId = existingFeedback.docs[0].id;
        }

        await addSystemUpdate(placeId, await getPlaceDisplayName(placeId, "Establishment"), user.uid, AppState.userProfile?.fullName || user.displayName || "Customer", "Customer confirmed received. Feedback is now ready.", "received", "📦", transactionId, bookingId || null);

        window.alert("Transaction completed. Please leave a rating and feedback.");

        setTimeout(() => {
            if (window.openFeedbackModal) {
                window.openFeedbackModal(placeId, bookingId || completionMessageId, feedbackMessageId);
            }
        }, 300);
    } catch (error) {
        window.alert("Error confirming received: " + error.message);
    }
};

window.openFeedbackModal = async function(placeId, bookingId, feedbackMessageId) {
const user = window.auth?.currentUser;
if (!user) return window.alert("Please log in first.");

if (feedbackMessageId) {
    try {
        const feedbackDoc = await window.db.collection("messages").doc(feedbackMessageId).get();
        if (feedbackDoc.exists && feedbackDoc.data().feedbackStatus === "feedback_submitted") {
            return window.alert("You already submitted feedback for this transaction.");
        }
    } catch (e) {
        console.warn("Feedback status check failed:", e);
    }
}

if(bookingId && !['null','undefined','manual'].includes(bookingId)) {
    try { const booking=await window.db.collection('bookings').doc(bookingId).get();
        if(booking.data()?.feedbackSubmittedAt || booking.data()?.feedbackStatus==='feedback_submitted')return window.alert('You already submitted feedback for this transaction.');
    } catch(error) { console.warn('Feedback completion lookup skipped:',error); }
}
if(document.querySelector('.feedback-modal'))return;
const modalId = "feedbackModal_" + Date.now();
window.lockBodyScroll(true);

const html = `
    <div id="${modalId}" class="feedback-modal" style="position:fixed; inset:0; z-index:999999; display:flex; align-items:center; justify-content:center;">
        <div class="modalBackdrop" style="position:absolute; inset:0; background:rgba(15,23,42,0.55);"></div>

        <div class="feedback-sheet" role="dialog" aria-modal="true" aria-labelledby="title_${modalId}" style="position:relative; background:var(--ui-surface,#fff); width:92%; max-width:440px; border-radius:22px; padding:22px; box-shadow:0 24px 60px rgba(15,23,42,0.25);">
            <h3 id="title_${modalId}" style="margin:0 0 6px; font-size:20px; color:var(--ui-text,#193a34);">Rate Your Experience</h3>
            <p style="margin:0 0 16px; color:var(--ui-muted,#58716a); font-size:13px; line-height:1.5;">
                How was your transaction? Your feedback helps improve local establishments.
            </p>

            <label style="font-size:13px; font-weight:800; color:var(--ui-text,#193a34);">Rating</label>
            <select id="fbRating_${modalId}" style="width:100%; box-sizing:border-box; padding:11px; border:1px solid #cbd5e1; border-radius:12px; margin:8px 0 12px;">
                <option value="5">⭐⭐⭐⭐⭐ 5 - Very Satisfied</option>
                <option value="4">⭐⭐⭐⭐ 4 - Satisfied</option>
                <option value="3">⭐⭐⭐ 3 - Okay</option>
                <option value="2">⭐⭐ 2 - Not Satisfied</option>
                <option value="1">⭐ 1 - Bad Experience</option>
            </select>

            <label style="font-size:13px; font-weight:800; color:var(--ui-text,#193a34);">Satisfaction</label>
            <select id="fbSatisfaction_${modalId}" style="width:100%; box-sizing:border-box; padding:11px; border:1px solid #cbd5e1; border-radius:12px; margin:8px 0 12px;">
                <option value="Very satisfied">Very satisfied</option>
                <option value="Satisfied">Satisfied</option>
                <option value="Neutral">Neutral</option>
                <option value="Not satisfied">Not satisfied</option>
                <option value="Needs improvement">Needs improvement</option>
            </select>

            <label style="font-size:13px; font-weight:800; color:var(--ui-text,#193a34);">Feedback / Comment</label>
            <textarea id="fbComment_${modalId}" placeholder="Write your feedback here, optional but recommended"
                style="width:100%; box-sizing:border-box; min-height:95px; padding:11px; border:1px solid #cbd5e1; border-radius:12px; resize:none; margin-top:8px;"></textarea>

            <label style="display:flex; gap:10px; align-items:flex-start; background:var(--ui-soft,#eef5f2); border:1px solid #e2e8f0; border-radius:12px; padding:10px; margin-top:12px; font-size:12px; color:var(--ui-text,#193a34); line-height:1.35; cursor:pointer;">
                <input type="checkbox" id="fbPublic_${modalId}" checked style="margin-top:2px;" />
                <span><b>Post publicly as a Verified Review</b><br><span style="color:var(--ui-muted,#58716a);">This helps the business build trust. You can uncheck this to keep the feedback inside the transaction only.</span></span>
            </label>

            <div style="display:flex; gap:10px; margin-top:16px;">
                <button id="cancel_${modalId}" style="flex:1; padding:12px; border:none; border-radius:12px; background:var(--ui-soft,#eef5f2); color:var(--ui-text,#193a34); font-weight:800; cursor:pointer;">Later</button>
                <button id="submit_${modalId}" style="flex:1; padding:12px; border:none; border-radius:12px; background:var(--ui-primary,#237e72); color:#fff; font-weight:900; cursor:pointer;">Send Feedback</button>
            </div>
        </div>
    </div>
`;

document.body.insertAdjacentHTML("beforeend", html);

const modal = document.getElementById(modalId);
window.LangManager?.translateDOM?.(undefined,modal);
const close = () => { window.lockBodyScroll(false); modal.remove(); };

document.getElementById(`cancel_${modalId}`).onclick = close;
modal.querySelector(".modalBackdrop").onclick = close;

let submitting = false;
const submitButton = document.getElementById(`submit_${modalId}`);
submitButton.onclick = async () => {
    if (submitting) return;
    const rating = Number(document.getElementById(`fbRating_${modalId}`).value);
    const satisfaction = document.getElementById(`fbSatisfaction_${modalId}`).value;
    const comment = document.getElementById(`fbComment_${modalId}`).value.trim();
    const postPublic = document.getElementById(`fbPublic_${modalId}`)?.checked !== false;

    if (!rating || rating < 1 || rating > 5) {
        return window.alert("Please select a valid rating.");
    }

    submitting = true;
    submitButton.disabled = true;
    let reviewSaved = false;
    try {
        const safeTransactionId = bookingId || feedbackMessageId || "manual";
        // A missing review cannot be read under the private-review rules.
        // The authenticated server validates completion and checks duplicates atomically.

        let txRequestType = null;
        let txRequestLabel = null;

        try {
            if (bookingId && bookingId !== feedbackMessageId && bookingId !== "manual") {
                const bookingDoc = await window.db.collection("bookings").doc(bookingId).get();
                if (bookingDoc.exists) {
                    const bookingData = bookingDoc.data();
                    txRequestType = bookingData.requestType || null;
                    txRequestLabel = bookingData.requestLabel || null;
                }
            }
        } catch (lookupError) {
            console.warn("Feedback request type lookup skipped:", lookupError);
        }

        const txMeta = getRequestMeta(txRequestType || "table_reservation");

        await window.ViciData.command("review", { placeId, bookingId: bookingId || undefined, rating, satisfaction, feedback: comment, isPublic: postPublic, createOnly: true, feedbackMessageId: feedbackMessageId && !["null","undefined"].includes(feedbackMessageId) ? feedbackMessageId : undefined });
        reviewSaved = true;
        window.invalidatePlacesCache?.();

        // The server commits review, booking marker and request status atomically.
        for(const item of typeof chatDeskOrders!=='undefined'?chatDeskOrders:[])if(item.id===bookingId)item.feedbackStatus='feedback_submitted';
        for(const item of typeof currentChatDocsCache!=='undefined'?currentChatDocsCache:[])if(item.id===feedbackMessageId)item.feedbackStatus='feedback_submitted';

        const placeName = await getPlaceDisplayName(placeId, "Establishment");

        await window.ContentPolicy.create(window.db, 'messages', {
            placeId,
            placeName,
            userId: user.uid,
            userName: AppState.userProfile?.fullName || user.displayName || "Customer",
            type: "feedback_response",
            bookingId,
            transactionId: safeTransactionId,
            requestType: txRequestType || txMeta.key,
            requestLabel: txRequestLabel || txMeta.shortLabel,
            rating,
            satisfaction,
            feedback: comment,
            publicReview: postPublic,
            verifiedTransaction: true,
            text: "Customer submitted feedback.",
            senderUid: user.uid,
            senderRole: "customer",
            senderName: AppState.userProfile?.fullName || user.displayName || "Customer",
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            reply: null
        });

        await addSystemUpdate(placeId, placeName, user.uid, AppState.userProfile?.fullName || user.displayName || "Customer", postPublic ? "Feedback submitted and posted as a public verified review." : "Feedback submitted privately for this transaction.", "feedback_submitted", "⭐", safeTransactionId, bookingId || null);

        close();
        window.alert("Thank you! Your rating and feedback were submitted.");

        if (window.MapPage) window.MapPage.refresh();
        if (window.viewPlace) {
            setTimeout(() => window.viewPlace(placeId), 600);
        }
    } catch (error) {
        if (reviewSaved) {
            // The review is already committed. A secondary chat update must not
            // report a failed submission or encourage another review write.
            console.warn("Review saved; conversation update failed:", error);
            close();
            window.alert("Thank you! Your rating and feedback were submitted.");
        } else {
            window.alert("Error submitting feedback: " + error.message);
        }
    } finally {
        submitting = false;
        submitButton.disabled = false;
    }
};

};

window.viewSharedLocation = function(lat, lng) {
window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
};

function renderRequirementList(requirements) {
let items = [];

if (requirements?.address) items.push("🏠 Delivery Address");
if (requirements?.location) items.push("📍 Current Location");
if (requirements?.payment) items.push("💳 Payment Details");
if (requirements?.orderDetails) items.push("📝 Order Details");

if (items.length === 0) return "No requirements specified.";

return items.map(i => `<div style="margin-top:4px;">${i}</div>`).join("");

}

function renderRequirementResponseDetails(d, isOwner, dateStr) {
let html = "";

if (d.requirements?.address) {
    html += `
        <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:12px; padding:10px; margin-top:10px;">
            <b style="color:#f97316;">🏠 Delivery Address</b>
            <div style="margin-top:6px;"><b>House/Street:</b> ${escapeHtml(d.houseStreet || "N/A")}</div>
            <div><b>Barangay:</b> ${escapeHtml(d.barangay || "N/A")}</div>
            <div><b>City:</b> ${escapeHtml(d.city || "N/A")}</div>
            <div><b>Landmark / Notes:</b> ${escapeHtml(d.landmark || "N/A")}</div>
        </div>
    `;
}

if (d.requirements?.location) {
    html += `
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:10px; margin-top:10px;">
            <b style="color:#16a34a;">📍 Shared Location</b>
            <div style="margin-top:6px;"><b>Lat:</b> ${escapeHtml(String(d.lat || "N/A"))}</div>
            <div><b>Lng:</b> ${escapeHtml(String(d.lng || "N/A"))}</div>
            ${d.lat && d.lng ? `
                <button onclick="window.viewSharedLocation(${d.lat}, ${d.lng})"
                    style="margin-top:8px; width:100%; border:none; background:#dcfce7; color:#166534; padding:9px; border-radius:10px; font-weight:800; cursor:pointer;">
                    View on Map
                </button>
            ` : ""}
        </div>
    `;
}


if (d.requirements?.orderDetails) {
    html += `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px; margin-top:10px;">
            <b>📝 Order Details</b>
            <div style="margin-top:6px;">${escapeHtml(d.orderDetails || "N/A")}</div>
        </div>
    `;
}

if (isOwner && !["confirmed","waived"].includes(d.requirementStatus) && (!d.canonicalRequirements || !deskOrder(d.bookingId) || deskOrder(d.bookingId).status === "accepted")) {
    html += `
        <button onclick="window.confirmRequirementResponse('${d.id}')"
            style="margin-top:12px; width:100%; border:none; background:#dcfce7; color:#166534; padding:10px; border-radius:10px; font-weight:800; cursor:pointer;">
            Confirm Requirements
        </button>
    `;
}

html += `<div style="font-size:10px; color:var(--ui-muted); margin-top:10px;">${dateStr}</div>`;

return html;

}

// ---- Message receipts: Sent / Delivered / Seen (v10) ----
// State lives on the message doc: status + deliveredAt + seenAt + seenBy.
function receiptState(d) {
    if (!d) return "sent";
    if (d.seenAt || d.status === "seen") return "seen";
    if (d.deliveredAt || d.status === "delivered") return "delivered";
    return "sent";
}
function receiptHtml(d, currentUid, opts) {
    const mine = d && (d.senderUid === currentUid || d.createdBy === currentUid);
    if (!mine) return "";
    const state = receiptState(d);
    const icon = state === "sent" ? "✓" : "✓✓";
    const label = state === "seen" ? "Seen" : state === "delivered" ? "Delivered" : "Sent";
    const cls = state === "seen" ? "is-seen" : state === "delivered" ? "is-delivered" : "is-sent";
    const time = opts && opts.time ? ` ${opts.time}` : "";
    return `<span class="msg-receipt ${cls}" title="${label}">${icon} ${label}${time}</span>`;
}
// Receipt markers are attempted AT MOST ONCE per doc per page session.
// If a marker write is denied by the live rules (or never persists for
// any reason), the field guards alone would retry on every snapshot for
// the whole session — these sets cap receipt writes at the doc count.
const _deliveredAttempted = new Set();
const _seenAttempted = new Set();

async function markIncomingDelivered(snapDocs, uid) {
    if (!uid || !snapDocs || !snapDocs.length) return;
    try {
        const batch = window.db.batch(); let n = 0;
        snapDocs.forEach(doc => {
            const d = doc.data ? doc.data() : doc;
            const id = doc.id;
            if (!id || !d || d.type !== "text") return;
            const sender = d.senderUid || d.createdBy;
            if (!sender || sender === uid) return;
            if (d.seenAt || d.deliveredAt) return;
            if ((d.deletedBy || []).includes(uid)) return;
            if (_deliveredAttempted.has(id)) return;
            _deliveredAttempted.add(id);
            batch.update(window.db.collection("messages").doc(id), {
                deliveredAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: "delivered"
            }); n++;
        });
        if (n) await batch.commit();
    } catch (e) { /* rules may restrict cross-user updates; receipts stay at Sent */ }
}
async function markIncomingSeen(docs, uid) {
    if (!uid || !docs || !docs.length) return;
    try {
        const batch = window.db.batch(); let n = 0;
        docs.forEach(d => {
            if (!d || !d.id || d.type !== "text" || document.hidden) return;
            const sender = d.senderUid || d.createdBy;
            if (!sender || sender === uid) return;
            if (d.seenAt) return;
            if ((d.deletedBy || []).includes(uid)) return;
            if (_seenAttempted.has(d.id)) return;
            _seenAttempted.add(d.id);
            const upd = {
                seenAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: "seen"
            };
            if (!d.deliveredAt) upd.deliveredAt = firebase.firestore.FieldValue.serverTimestamp();
            batch.update(window.db.collection("messages").doc(d.id), upd); n++;
        });
        if (n) await batch.commit();
    } catch (e) { /* same as delivered: fail silently */ }
}
window.markIncomingDelivered = markIncomingDelivered;
window.markIncomingSeen = markIncomingSeen;

function renderTextBubble(d, currentUid, dateStr, options = {}) {
    const isMine = d.senderUid === currentUid;
    return `<div class="chat-message-row ${isMine ? "is-mine" : "is-other"}${options.grouped ? " is-grouped" : ""}">
        ${!isMine ? `<span data-no-translate class="chat-sender-avatar" aria-hidden="true">${escapeHtml(String(d.senderName || "B").charAt(0).toUpperCase())}</span>` : ""}
        <div class="chat-bubble ${isMine ? "me" : "other"}">
            ${!isMine && !options.grouped && d.senderName ? `<span data-no-translate class="chat-message-sender">${escapeHtml(d.senderName)}</span>` : ""}
            ${d.isAutoReply ? '<span class="chat-auto-reply-label">Automatic reply</span>' : ''}
            <div class="chat-message-text">${escapeHtml(d.text || "")}</div>
            ${/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(d.photoData || '') && d.photoData.length<=62000 ? `<img class="chat-attachment-image" src="${escapeHtml(d.photoData)}" alt="Chat photo attachment" loading="lazy">` : ''}
            ${d.isAutoReply && d.autoReplyTopic==='menu' ? `<button type="button" class="chat-auto-menu" data-auto-menu="${escapeHtml(d.placeId)}">View Menu</button>` : ''}
            <div class="chat-message-meta">${isMine ? receiptHtml(d, currentUid, { time: dateStr }) : escapeHtml(dateStr)}</div>
        </div>
    </div>`;
}

function renderLegacyMessage(d, isOwner, dateStr, replyDateStr) {
    let html = "";
    // Legacy customer text and owner reply use the same presentation, without
    // inventing delivery/seen receipts that are absent on these older records.
    const bubble = (text, mine, time) => `<div class="chat-message-row ${mine ? "is-mine" : "is-other"}"><div class="chat-bubble ${mine ? "me" : "other"}"><div class="chat-message-text">${escapeHtml(text)}</div><div class="chat-message-meta">${escapeHtml(time)}</div></div></div>`;
    if (d.text) html += bubble(d.text, !isOwner, dateStr);
    if (d.reply) html += bubble(d.reply, isOwner, replyDateStr);
    return html;
}

function isSelectedTransactionMessage(message,bookingId) {
    if(isConversationMessage(message))return false;
    const links=[message.bookingId,message.transactionId,message.type==='booking_card'?message.id:null].filter(Boolean);
    return !!bookingId && (links.includes(bookingId)||(!links.length&&message.type!=='text'));
}
function isConversationMessage(message) { return (!message.type || message.type==='text') && !message.bookingId && !message.transactionId; }
window.isConversationMessage=isConversationMessage;
function renderPinnedTransactionHistory(message, time, orders) {
    const kinds={booking_card:'Request recorded',requirement_request:'Business requested transaction details.',requirement_response:'Customer submitted transaction details.',completion_request:'Transaction progress updated.'};
    if(!kinds[message.type] || !orders.some(order=>[order.id,order.bookingId].filter(Boolean).some(id=>[message.bookingId,message.transactionId,message.type==='booking_card'?message.id:null].filter(Boolean).includes(id))))return null;
    const translate=text=>window.LangManager?.translateKey?.(text)||text;
    return `<div class="transaction-history-update"><i data-lucide="clipboard-check" aria-hidden="true"></i><span>${escapeHtml(translate(kinds[message.type]))}</span><time>${escapeHtml(time)}</time></div>`;
}

function chatDayInfo(message, now = new Date()) {
    const stamp = message.createdAt?.toDate?.();
    const date = stamp instanceof Date && Number.isFinite(stamp.getTime()) ? stamp : now;
    const key = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    const midnight = value => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const label = midnight(date) === midnight(now) ? "Today" : midnight(date) === midnight(yesterday) ? "Yesterday"
        : date.toLocaleDateString([], { month: "short", day: "numeric", ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}) });
    return { key, label };
}

let chatDeskOrders = [], chatDeskSelected = null;
const transactionDeskBusy = new Set();
function transactionChoiceLabel(order) {
    const t=s=>window.LangManager?.translateKey?.(s)||s;
    const locale=window.LangManager?.getLanguage?.()==='ph'?'fil-PH':'en-PH';
    const legacy=String(order.details||'');
    const date=order.bookingDate||legacy.match(/^Date:\s*(.+)$/mi)?.[1]||'';
    const time=order.bookingTime||legacy.match(/^Time:\s*(.+)$/mi)?.[1]||'';
    let when=[date,time].filter(Boolean).join(' ');
    if(/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const stamp=new Date(date+'T'+(/^\d{2}:\d{2}$/.test(time)?time:'12:00')+':00+08:00');
        if(Number.isFinite(stamp.getTime()))when=new Intl.DateTimeFormat(locale,{timeZone:'Asia/Manila',month:'short',day:'numeric',year:'numeric',...(time?{hour:'numeric',minute:'2-digit'}:{})}).format(stamp);
    }
    if(!when){const stamp=order.createdAt?.toDate?.();if(stamp instanceof Date&&Number.isFinite(stamp.getTime()))when=new Intl.DateTimeFormat(locale,{timeZone:'Asia/Manila',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(stamp);}
    const status=order.status||order.bookingStatus||'pending';
    const labels={pending:'Pending',accepted:'Accepted',received:'Completed',cancelled:'Cancelled',rejected:'Rejected',fulfilled:'Ready',delivered:'Delivered'};
    return [t(order.requestLabel||'Request'),when,t(labels[status]||status.replace(/_/g,' ')),'#'+String(order.id||order.bookingId||'').slice(-6)].filter(Boolean).join(' · ');
}
function deskOrder(id) { return chatDeskOrders.find(d=>d.id===id) || currentChatDocsCache.find(d=>d.type==='booking_card'&&d.bookingId===id); }
function deskRequirements(order,docs=currentChatDocsCache) {
    if(order.requirementsState)return {...order.requirementsState,canonical:true};
    const id=order.bookingId||order.id;
    const requests=docs.filter(d=>d.type==='requirement_request'&&[d.bookingId,d.transactionId].includes(id));
    requests.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
    const req=requests[0];if(!req)return null;
    const required={address:!!req.requirements?.address,location:!!req.requirements?.location,orderDetails:!!req.requirements?.orderDetails};
    if(!Object.values(required).some(Boolean))return null;
    const responses=docs.filter(d=>d.type==='requirement_response'&&d.requestMessageId===req.id);
    responses.sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
    const response=responses[0];
    return {requestId:req.id,responseId:response?.id,status:response?.requirementStatus||req.requirementStatus||'waiting_customer',required,notes:req.notes||'',data:response||{},canonical:false};
}
function renderRequestProcess(order,requirements) {
    const t=s=>window.LangManager?.translateKey?.(s)||s,status=order.status||order.bookingStatus||'pending',flow=window.PaymentPolicy.flow(order);
    const active=!['cancelled','rejected'].includes(status);
    if(!active)return '';
    const requirementDone=requirements?['confirmed','waived'].includes(requirements.status):!!order.paymentTermsVersion||!['pending','accepted'].includes(status);
    const steps=[['Request sent',true],['Acceptance',status!=='pending'],['Requirements',requirementDone&&flow.addressReady],['Payment',flow.verified],['Preparation',['delivered','fulfilled','received'].includes(status)],['Completion',status==='received']];
    let current=active?steps.findIndex(([,done])=>!done):-1;
    const currentLabel=current>=0?steps[current][0]:status==='received'?'Completed':status;
    return `<details class="transaction-process-details"><summary>${escapeHtml(t('Request progress'))} · ${escapeHtml(t(currentLabel))}</summary><ol class="transaction-process" aria-label="${escapeHtml(t('Request progress'))}">${steps.map(([label,done],index)=>`<li class="${(current===-1||index<current)?'is-done':index===current?'is-current':'is-pending'}"${index===current?' aria-current="step"':''}><span aria-hidden="true">${(current===-1||index<current)?'✓':index+1}</span>${escapeHtml(t(label))}</li>`).join('')}</ol></details>`;
}
function renderDeskRequirements(state) {
    const t=s=>window.LangManager?.translateKey?.(s)||s;
    if(!state)return '';
    const labels={address:'Delivery Address',location:'Current Location',orderDetails:'Order Details'};
    const status=['confirmed','waived'].includes(state.status)?state.status:state.status==='submitted'?'submitted':'waiting_customer';
    const label={confirmed:'Confirmed',waived:'Not required',submitted:'Submitted',waiting_customer:'Needed'}[status];
    const keys=Object.keys(labels).filter(key=>state.required?.[key]);
    const data=state.data||{};
    const value=key=>key==='address'?[data.houseStreet,data.barangay,data.city,data.landmark].filter(Boolean).join(', '):key==='location'?(data.lat!=null&&data.lng!=null?`${data.lat}, ${data.lng}`:''):data.orderDetails||'';
    return `<details class="transaction-requirements"><summary><b>${escapeHtml(t('Requirements'))}</b><span>${keys.length?`${status==='waiting_customer'?'0':keys.length}/${keys.length} `:''}${escapeHtml(t(label))}</span><small>${keys.map(key=>escapeHtml(t(labels[key]))).join(' · ')}</small></summary>${state.notes?`<p data-no-translate>${escapeHtml(state.notes)}</p>`:''}<ul>${keys.map(key=>`<li><div><b>${escapeHtml(t(labels[key]))}</b><small class="requirement-state state-${status}">${escapeHtml(t(label))}</small></div>${value(key)?`<p data-no-translate>${escapeHtml(value(key))}</p>`:''}</li>`).join('')}</ul></details>`;
}
function renderTransactionDesk(order,isOwner,orders=[]) {
    if(!order)return '';
    const t=s=>window.LangManager?.translateKey?.(s)||s, esc=escapeHtml;
    const id=order.bookingId||order.id,status=order.status||order.bookingStatus||'pending',flow=window.PaymentPolicy.flow(order);
    const requirements=deskRequirements(order);
    const detailsReady=!requirements||['confirmed','waived'].includes(requirements.status);
    const action=(key,label)=>`<button type="button" data-tx-action="${key}" data-booking-id="${esc(id)}">${esc(t(label))}</button>`;
    let next='',buttons='';
    if(status==='pending'){next=isOwner?'Accept or decline this request.':'Wait for the business to accept your request.';if(isOwner)buttons=action('accept','Accept Request')+action('reject','Reject');}
    else if(status==='accepted'&&!requirements&&!order.paymentTermsVersion){next=isOwner?'Request the details you need, or confirm that no additional details are required.':'The business is checking the requirements before payment.';if(isOwner)buttons=action('requirements-none','No additional details needed');}
    else if(status==='accepted'&&requirements&&['waiting_customer','submitted'].includes(requirements.status)){
        next=requirements.status==='submitted'?(isOwner?'Review the submitted details before continuing.':'Your details were submitted. Wait for business review.'):(isOwner?'Waiting for the requested customer details.':'Complete the requested details to continue.');
        if(!isOwner&&requirements.status==='waiting_customer')buttons=action('requirements-submit','Submit requirements');
        if(isOwner&&requirements.status==='submitted'&&requirements.responseId)buttons=action('requirements-confirm','Confirm details');
        if(isOwner&&requirements.canonical)buttons+=action('requirements-waive','Skip requested details');
    }
    else if(status==='accepted'&&!flow.addressReady){next='Add the delivery address before the final amount is set.';if(!isOwner)buttons=action('delivery-details','Add delivery address');}
    else if(status==='accepted'&&(!flow.termsReady||!flow.online||!order.paymentMethod)){next='The business must set the amount and payment instructions first.';if(isOwner)buttons=action('terms','Set payment instructions');}
    else if(status==='accepted'&&flow.online){
        const terms=order.paymentAmountDue&&order.paymentInstructions;
        next=terms?(isOwner?'Waiting for the customer to submit payment details.':'Pay the agreed amount once, then submit your reference.'): 'The business must set the amount and payment instructions first.';
        if(isOwner)buttons=action('terms',terms?'Edit payment instructions':'Set payment instructions');
        else if(terms||order.paymentFlowVersion!==2)buttons=action('proof',order.paymentReviewDecision==='declined'?'Correct payment details':'Submit payment reference');
    } else if(status==='payment_submitted'){next=isOwner?'Check the reference and money received before verifying payment.':'Payment is under review. Do not pay again.';if(isOwner)buttons=action('verify','Verify payment')+action('decline','Request correction');}
    else if(flow.canPrepare){next='Payment verified. The business can now prepare your request.';if(isOwner)buttons=action('prepare','Start preparing');}
    else if(status==='preparing'){next='The business is preparing your request.';if(isOwner)buttons=action(['delivery','delivery_order'].includes(order.requestType)?'dispatch':'ready',['delivery','delivery_order'].includes(order.requestType)?'Mark out for delivery':'Mark ready');}
    else if(status==='ready'){next='Your request is ready.';if(isOwner)buttons=action('fulfill','Mark fulfilled');}
    else if(status==='out_for_delivery'){next='Your order is on the way.';if(isOwner)buttons=action('deliver','Mark delivered');}
    else if(['fulfilled','delivered'].includes(status)){next='Confirm only after you receive the order or service.';if(!isOwner)buttons=action('receive','Confirm Received');}
    else if(status==='received'){next=order.feedbackStatus==='feedback_waiting'&&!order.feedbackSubmittedAt?'Transaction completed. Please rate your experience and send feedback.':'Transaction completed.';if(!isOwner&&order.feedbackStatus==='feedback_waiting'&&!order.feedbackSubmittedAt)buttons=action('feedback','Rate & Send Feedback');}
    else if(status==='cancelled'){
        const refund=order.refundStatus;
        if(refund==='needs_verification'){next='Verify the actual payment received before calculating the refund.';if(isOwner)buttons=action('refund-check','Verify received payment')+action('refund-missing','Payment not found');}
        else if(refund==='pending'){next='The business must review and approve the calculated refund.';if(isOwner)buttons=action('refund-approve','Review refund');}
        else if(['approved','disputed'].includes(refund)){next=refund==='disputed'?'The customer reported the refund was not received. Check the transfer before recording a correction.':'Refund approved. Transfer the displayed amount, then record the reference.';if(isOwner)buttons=action('refund-send','Record refund transfer');}
        else if(refund==='sent'){next='The business recorded a refund transfer. Confirm after checking your account.';if(!isOwner)buttons=action('refund-receive','Confirm refund received')+action('refund-dispute','Refund not received');}
        else if(refund==='received')next='The customer confirmed the refund was received.';
        else if(refund==='payment_not_found'){next='The business could not find this payment. Check the reference before requesting a recheck.';if(!isOwner)buttons=action('refund-recheck','Request payment recheck');}
        else next=refund==='not_required'?'Cancelled. No refund is due.':'Cancelled. Ask the business to review any earlier payment.';
    }else next='This request is closed.';
    if(isOwner&&status==='accepted'&&(!requirements||['confirmed','waived'].includes(requirements.status)))buttons+=action('requirements-request','Request details');
    if(isOwner&&!['received','cancelled','rejected'].includes(status))buttons+=action('owner-cancel','Cancel request');
    if(!isOwner&&window.PaymentPolicy.cancellation(order).allowed)buttons+=action('cancel','Cancel request');
    const value=(label,value,personal=false)=>value?`<div><dt>${esc(t(label))}</dt><dd${personal?' data-no-translate':''}>${esc(String(value))}</dd></div>`:'';
    return `<div class="transaction-desk-top"><b>${esc(t('Current transaction'))}</b><span>${esc(t(status.replace(/_/g,' ')))}</span></div>${renderRequestProcess(order,requirements)}<p class="transaction-desk-next">${esc(t(next))}</p>${!['cancelled','rejected'].includes(status)?renderDeskRequirements(requirements):''}${status==='accepted'&&flow.online&&flow.termsReady&&detailsReady&&order.paymentInstructions?`<p class="transaction-desk-payto" data-no-translate>${esc(order.paymentInstructions)}</p>`:''}<dl class="transaction-desk-money">${value('Amount due',flow.termsReady&&detailsReady&&order.paymentAmountDue?'₱'+order.paymentAmountDue:'')}${value('Submitted payment',order.paymentAmount?'₱'+order.paymentAmount:'')}${value('Reference',order.paymentReference,true)}${value('Refund amount',order.refundAmount!=null?'₱'+order.refundAmount:'')}${value('Refund calculation',order.refundBaseAmount&&order.refundAmount!=null?'₱'+order.refundBaseAmount+' × '+order.refundPercent+'%':'')}${value('Refund reference',order.refundReference,true)}</dl><details class="transaction-desk-details"><summary>${esc(t('Payment and request details'))}</summary><p class="transaction-desk-next">${esc(t('Refund rate before preparation'))}: ${esc(String(order.refundPercent ?? 50))}% · ${esc(t('Cancellation closes when preparation starts.'))}</p><p class="transaction-desk-id" data-no-translate>TX-${esc(String(id).slice(-8))}</p>${flow.termsReady&&detailsReady&&order.paymentInstructions?`<p data-no-translate>${esc(order.paymentInstructions)}</p>`:''}<dl>${value('Reference',order.paymentReference,true)}${value('Refund reference',order.refundReference,true)}${value('Business note',order.paymentReviewNote||order.refundNote,true)}</dl>${order.paymentProofPath?`<div class="transaction-desk-proof" data-tx-proof="${esc(order.paymentProofPath)}" data-booking-id="${esc(id)}"></div>`:''}${renderRequestDetailRows(order)}<p>${esc(t('Vicinify records manual payments and refunds. It does not transfer money.'))}</p></details><div class="transaction-desk-actions">${buttons}</div>`;
}
function refreshTransactionDesk(isOwner) {
    if(document.getElementById('chatModal')?.dataset.mode==='messages'){document.getElementById('chatTransactionSummary')?.classList.add('hidden');return;}

    const wrap=document.getElementById('chatTransactionSummary');if(!wrap)return;
    const fallback=currentChatDocsCache.filter(d=>d.type==='booking_card').map(d=>({...d,id:d.bookingId}));
    const orders=chatDeskOrders.length?chatDeskOrders:fallback;
    if(!chatDeskSelected || !orders.some(d=>d.id===chatDeskSelected) && !document.getElementById('chatModal')?.dataset.transactionId)chatDeskSelected=orders[0]?.id;
    const order=orders.find(d=>d.id===chatDeskSelected);
    const closed=order&&window.PaymentPolicy.conversationClosed(order);
    const modal=document.getElementById('chatModal');if(modal)modal.dataset.archived=closed?'true':'false';
    const suggestions=document.getElementById('chatSuggestions');
    if(suggestions){const active=order&&!['received','rejected'].includes(order.status)&&!(order.status==='cancelled'&&['received','not_required'].includes(order.refundStatus));suggestions.hidden=isOwner||!!active;}
    const markup=renderTransactionDesk(order,isOwner,orders);
    wrap.classList.toggle('hidden',!order);
    if(wrap.__transactionMarkup===markup)return;
    const same=wrap.dataset.bookingId===(order?.bookingId||order?.id||'');
    const openRequirements=same&&!!wrap.querySelector('.transaction-requirements')?.open,openDetails=same&&!!wrap.querySelector('.transaction-desk-details')?.open;
    const openProcess=same&&!!wrap.querySelector('.transaction-process-details')?.open;
    const oldScroll=same?wrap.scrollTop:0,focused=document.activeElement;
    const focusAction=wrap.contains(focused)?focused?.dataset?.txAction:null;
    wrap.__transactionMarkup=markup;wrap.dataset.bookingId=order?.bookingId||order?.id||'';wrap.innerHTML=markup;
    if(openProcess&&wrap.querySelector('.transaction-process-details'))wrap.querySelector('.transaction-process-details').open=true;
    if(openRequirements&&wrap.querySelector('.transaction-requirements'))wrap.querySelector('.transaction-requirements').open=true;
    if(openDetails&&wrap.querySelector('.transaction-desk-details'))wrap.querySelector('.transaction-desk-details').open=true;
    wrap.scrollTop=oldScroll;
    if(focusAction){[...wrap.querySelectorAll('[data-tx-action]')].find(button=>button.dataset.txAction===focusAction)?.focus({preventScroll:true});}

    const progress=wrap.querySelector('.transaction-process'),currentStep=progress?.querySelector('[aria-current=step]');
    if(currentStep)progress.scrollLeft=Math.max(0,currentStep.offsetLeft-progress.offsetLeft-(progress.clientWidth-currentStep.offsetWidth)/2);
    const detail=wrap.querySelector('.transaction-desk-details');
    if(detail)detail.ontoggle=()=>{const proof=detail.querySelector('[data-tx-proof]');if(detail.open&&proof&&!proof.firstChild){const img=document.createElement('img');img.alt=window.LangManager?.translateKey?.('Payment proof')||'Payment proof';img.dataset.proofBooking=proof.dataset.bookingId;img.dataset.proofVersion=proof.dataset.txProof;proof.append(img);}};
    wrap.onclick=e=>{const button=e.target.closest('[data-tx-action]');if(button)window.transactionDeskAction(button.dataset.txAction,button.dataset.bookingId,button.dataset.messageId)};
    window.LangManager?.translateDOM?.(undefined,wrap);window.debouncedIcons?.();
}
function transactionInputDialog(title,fields,note,submitLabel='Save') {
    if(document.getElementById('transactionActionModal'))return Promise.resolve(null);
    return new Promise(resolve=>{
        const modal=document.createElement('div');modal.id='transactionActionModal';modal.className='req-modal';
        modal.innerHTML=`<div class="modalBackdrop"></div><form class="req-sheet" role="dialog" aria-modal="true" aria-labelledby="transactionActionTitle"><header class="req-head"><div class="req-head-text"><h3 id="transactionActionTitle">${escapeHtml(title)}</h3><p>${escapeHtml(note)}</p></div></header><div class="req-body">${fields.map(f=>`<label class="req-field"><span>${escapeHtml(f.label)}</span>${f.area?`<textarea class="req-input" name="${f.name}" required minlength="${f.min||3}" maxlength="1000">${escapeHtml(f.value||'')}</textarea>`:`<input class="req-input" name="${f.name}" required ${f.readOnly?'readonly':''} ${f.money?'inputmode="decimal"':'minlength="3" maxlength="200"'} value="${escapeHtml(f.value||'')}">`}</label>`).join('')}</div><footer class="req-footer"><button type="button" class="req-btn ghost">Cancel</button><button type="submit" class="req-btn primary">${escapeHtml(submitLabel)}</button></footer></form>`;
        const prior=document.activeElement,finish=value=>{document.removeEventListener('keydown',key);modal.remove();prior?.focus?.();resolve(value)};
        const key=e=>{if(e.key==='Escape')finish(null);if(e.key==='Tab'){const all=[...modal.querySelectorAll('input,textarea,button')];if(e.shiftKey&&document.activeElement===all[0]){e.preventDefault();all.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===all.at(-1)){e.preventDefault();all[0].focus()}}};
        modal.querySelector('.modalBackdrop').onclick=()=>finish(null);modal.querySelector('[type=button]').onclick=()=>finish(null);
        modal.querySelector('form').onsubmit=e=>{e.preventDefault();
            for(const field of fields.filter(f=>f.money)){const input=e.target.elements[field.name];input.setCustomValidity('');try{window.PaymentPolicy.money(input.value)}catch(error){input.setCustomValidity(window.LangManager?.translateKey?.(error.message)||error.message);input.reportValidity();return;}}
            if(e.target.reportValidity())finish(Object.fromEntries(new FormData(e.target)))};
        modal.querySelectorAll('input,textarea').forEach(input=>input.oninput=()=>input.setCustomValidity(''));
        document.body.append(modal);document.addEventListener('keydown',key);window.LangManager?.translateDOM?.(undefined,modal);modal.querySelector('input,textarea').focus();
    });
}
window.transactionDeskAction=async function(action,id,messageId){
    if(transactionDeskBusy.has(id))return;const order=deskOrder(id);if(!order)return;
    transactionDeskBusy.add(id);
    try{
        let patch;
        if(action==='requirements-none'){
            if(!await window.vConfirm('No additional details needed','Confirm that the request already contains everything needed. Payment instructions come next.','Confirm'))return;
            patch={requirements:{action:'not_required'}};
        }
        if(action==='feedback')return await window.openFeedbackModal(order.placeId,id,currentChatDocsCache.find(d=>d.type==='feedback_request'&&d.bookingId===id)?.id);
        if(action==='requirements-request')return window.openRequirementRequestModal();
        if(action==='requirements-submit'){const req=deskRequirements(order);if(req)return await window.openRequirementResponseModal(req.requestId);return;}
        if(action==='requirements-confirm'){const req=deskRequirements(order);if(req?.responseId)return await window.confirmRequirementResponse(req.responseId);return;}
        if(action==='requirements-waive'){
            const req=deskRequirements(order);if(!req)return;
            if(!await window.vConfirm('Skip requested details?','These details will no longer be required. Payment must still be verified before preparation.','Continue'))return;
            patch={requirements:{action:'waive',requestId:req.requestId}};
        }else if(action==='proof')return await window.uploadPaymentProof(id,'');
        if(['verify','decline'].includes(action))return await window.reviewPaymentProof(id,'',action==='verify'?'confirm':'resubmit');
        if(['requirements-waive','requirements-none'].includes(action)){ /* patch already validated above */ }else if(action==='owner-cancel'){
            if(!await window.vConfirm('Cancel request','Cancel this transaction? Any pending refund must still be resolved before the conversation is archived.','Confirm'))return;
            patch={status:'cancelled'};
        }else if(action==='cancel'){
            if(!await window.SettingsPage.reviewCancellation(order))return;
            patch={status:'cancelled'};
        }else if(action==='delivery-details'){
            const input=await transactionInputDialog('Delivery address',[{name:'houseStreet',label:'House number, street or subdivision'},{name:'barangay',label:'Barangay'},{name:'city',label:'City / Municipality'},{name:'landmark',label:'Landmark'}],'The business uses this address to confirm the total and delivery fee.');if(!input)return;patch={deliveryDetails:input};
        }else if(action==='terms'){
            const input=await transactionInputDialog('Set payment instructions',[{name:'paymentMethod',label:'Payment Method',value:window.PaymentPolicy.isOnline(order)?order.paymentMethod:'GCash'},{name:'amount',label:'Amount due now (₱)',money:true,value:order.paymentAmountDue},{name:'instructions',label:'Payment recipient and instructions',area:true,min:8,value:order.paymentInstructions}],'Include the recipient name, account number and agreed amount. This does not confirm a payment.');if(!input)return;patch={paymentTerms:input};
        }else if(action==='refund-check'){
            const input=await transactionInputDialog('Verify received payment',[{name:'receivedAmount',label:'Amount actually received (₱)',money:true,value:order.paymentAmount}],'Check your account first. The refund will be calculated using the saved cancellation rate.');if(!input)return;patch={refundStatus:'pending',...input};
        }else if(action==='refund-missing'){
            const input=await transactionInputDialog('Payment not found',[{name:'refundNote',label:'Explain what needs checking',area:true}],'The customer can ask you to recheck. This does not mark a refund received.');if(!input)return;patch={refundStatus:'payment_not_found',...input};
        }else if(action==='refund-approve'){
            if(!await window.vConfirm('Approve refund','Confirm the refund amount: ₱'+order.refundAmount+'. This approves the refund; it does not transfer money.','Approve refund'))return;patch={refundStatus:'approved',confirmRefund:true};
        }else if(action==='refund-send'){
            const input=await transactionInputDialog('Record refund transfer',[{name:'amount',label:'Refund amount',value:order.refundAmount,readOnly:true},{name:'refundReference',label:'Refund transfer reference'}],'Transfer the displayed refund amount yourself first. Recording a reference does not move money.','Record transfer');if(!input)return;if(!await window.vConfirm('Confirm refund transfer','I have transferred ₱'+order.refundAmount+' and checked the reference against my account.','Confirm transferred'))return;patch={refundStatus:'sent',...input,confirmTransferred:true};
        }else if(action==='refund-receive'){
            if(!await window.vConfirm('Confirm refund received','Check your account and confirm you received the displayed refund amount.','Confirm'))return;patch={refundStatus:'received',confirmReceived:true};
        }else if(action==='refund-dispute'){
            const input=await transactionInputDialog('Refund not received',[{name:'refundNote',label:'What needs checking?',area:true}],'Check your account first. The refund will stay open for the business to review.');if(!input)return;patch={refundStatus:'disputed',...input};
        }else if(action==='refund-recheck')patch={refundStatus:'needs_verification'};
        else if(action==='receive')return await window.confirmReceivedFromChat(id,'',order.placeId);
        else{
            const status={accept:'accepted',reject:'rejected',prepare:'preparing',ready:'ready',dispatch:'out_for_delivery',deliver:'delivered',fulfill:'fulfilled'}[action];
            if(!status)return;
            if(action==='prepare'&&!await window.vConfirm('Start preparing?','Starting preparation closes customer cancellation. Verify payment and delivery details first.','Start preparing'))return;
            if(['accept','reject'].includes(action))return await window.updateBookingFromChat(id,currentChatDocsCache.find(d=>d.type==='booking_card'&&d.bookingId===id)?.id||'',status);
            patch={status};
        }
        await window.ViciData.command('booking',{bookingId:id,patch});window.showToast?.('Transaction updated.','success');
    }catch(error){window.showToast?.(error.message,'error')}finally{transactionDeskBusy.delete(id)}
};


window.addEventListener('vicinify:languagechange',()=>{
    const modal=document.getElementById('chatModal'),user=window.auth?.currentUser,target=document.getElementById('chatCustomerUid')?.value;
    if(modal&&!modal.classList.contains('hidden')&&user&&target)refreshTransactionDesk(user.uid!==target);
});

function listenToChatRoom(placeId, targetUid, bookingId=null) {
if (currentChatUnsub) currentChatUnsub();
chatDeskOrders=[];chatDeskSelected=bookingId;currentChatDocsCache=[];
const chatModal=document.getElementById('chatModal');if(chatModal)chatModal.dataset.transactionId=bookingId||'';
document.getElementById('chatTransactionSummary')?.classList.add('hidden');

const listWrap = document.getElementById("chatMessageList");
if (!listWrap) return;

const user = window.auth?.currentUser;
const isOwner = user && user.uid !== targetUid;

listWrap.innerHTML = `<div class="muted" style="text-align:center; padding:20px; font-size:12px;" data-i18n="Loading conversation...">Loading conversation...</div>`;

// Coalesce snapshot renders: snapshots arriving back-to-back (e.g. the
// echo of our own seen-marker writes) render ONCE per frame with the
// latest data instead of rebuilding the whole thread every time.
let _pendingChatSnap = null;
let _lastChatSnap = null;
let _chatRenderQueued = false;
const queueChatRender = (snap) => {
    _lastChatSnap = snap;
    _pendingChatSnap = snap;
    if (_chatRenderQueued) return;
    _chatRenderQueued = true;
    requestAnimationFrame(() => {
        _chatRenderQueued = false;
        const s = _pendingChatSnap;
        _pendingChatSnap = null;
        if (!s) return;
        // A different chat may have opened meanwhile; never paint stale.
        if (document.getElementById("chatPlaceId")?.value !== placeId) return;
        if (document.getElementById("chatCustomerUid")?.value !== targetUid) return;
        renderChatSnap(s);
    });
};

const onTransactionChange=()=>{if(_lastChatSnap)queueChatRender(_lastChatSnap);};
document.getElementById('chatModal')?.addEventListener('transactionchange',onTransactionChange);
const stopMessages = window.db.collection("messages")
    .where("placeId", "==", placeId)
    .where("userId", "==", targetUid)
    .orderBy("createdAt", "desc")
    .limit(100)
    .onSnapshot(snap => queueChatRender(snap), err => {
        console.error("Chat listener error:", err);
        if (!window.handleFirestoreError(err)) {
            const missingIndex = err.code === "failed-precondition" && /index/i.test(err.message || "");
            listWrap.innerHTML = `<div class="chat-empty" role="alert"><h4>${missingIndex ? "Chat setup needed" : "Messages could not load"}</h4><p>${missingIndex ? "The database index for this conversation is missing or still building. Please contact the site administrator." : "Check your connection and try reopening this conversation."}</p></div>`;
        }
    });


const stopOrders=document.getElementById('chatModal')?.dataset.mode==='messages'?()=>{}:window.ViciData.listen('chat-orders:'+placeId+':'+targetUid+':'+(bookingId||'recent'),
    (bookingId?window.db.collection('bookings').doc(bookingId):window.db.collection('bookings').where('placeId','==',placeId).where('userId','==',targetUid).orderBy('createdAt','desc').limit(5)),snap=>{
        if(document.getElementById('chatPlaceId')?.value!==placeId||document.getElementById('chatCustomerUid')?.value!==targetUid)return;
        const previous=chatDeskOrders.find(order=>order.id===chatDeskSelected);
        chatDeskOrders=(bookingId?(snap.exists?[snap]:[]):snap.docs).map(d=>({...d.data(),id:d.id,bookingId:d.id})).filter(order=>!bookingId||(order.placeId===placeId&&order.userId===targetUid));
        const current=chatDeskOrders.find(order=>order.id===chatDeskSelected);
        if(previous&&current&&!window.PaymentPolicy.conversationClosed(previous)&&window.PaymentPolicy.conversationClosed(current)){
            window.closeChatModal();window.showToast?.('Transaction conversation archived. The record remains in history.','info');return;
        }
        refreshTransactionDesk(isOwner);
        if(_lastChatSnap)queueChatRender(_lastChatSnap);
    },error=>{console.warn('Transaction summary unavailable:',error);window.showToast?.('Transaction summary could not load. Please try reopening the conversation.','error');});
currentChatUnsub=()=>{document.getElementById('chatModal')?.removeEventListener('transactionchange',onTransactionChange);stopMessages();stopOrders();chatDeskOrders=[];chatDeskSelected=null;const panel=document.getElementById('chatTransactionSummary');if(panel){panel.classList.add('hidden');panel.replaceChildren();panel.__transactionMarkup=null;delete panel.dataset.bookingId;}};

const renderChatSnap = (snap) => {
        if (snap.empty) {
            listWrap.innerHTML = `<div class="chat-empty"><span class="chat-empty-icon"><i data-lucide="messages-square"></i></span><h4>Start a conversation</h4><p>${document.getElementById('chatModal')?.dataset.mode==='transaction'?'Send a message about the selected transaction.':'Ask about the menu, availability, or your request. Choose a quick question below to get started.'}</p></div>`;
            window.debouncedIcons?.();
            return;
        }

        let docs = snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(d => !(d.deletedBy || []).includes(user?.uid));
        currentChatDocsCache = docs;
        refreshTransactionDesk(isOwner);
        docs=docs.filter(d=>document.getElementById('chatModal')?.dataset.mode==='messages'?isConversationMessage(d):isSelectedTransactionMessage(d,chatDeskSelected));

        if (docs.length === 0) {
            listWrap.innerHTML = `<div class="chat-empty"><span class="chat-empty-icon"><i data-lucide="messages-square"></i></span><h4>Start a conversation</h4><p>${document.getElementById('chatModal')?.dataset.mode==='transaction'?'Send a message about the selected transaction.':'Ask about the menu, availability, or your request. Choose a quick question below to get started.'}</p></div>`;
            window.debouncedIcons?.();
            return;
        }

        // Pending server timestamps are null locally; treat them as "now"
        // so a just-sent message stays at the bottom instead of jumping to the top.
        const msgMillis = d => (d.createdAt && typeof d.createdAt.toMillis === "function") ? d.createdAt.toMillis() : Date.now();
        docs.sort((a, b) => msgMillis(a) - msgMillis(b));

        // I'm viewing this thread: incoming messages become Seen (and Delivered if skipped).
        if (user?.uid && !document.hidden) markIncomingSeen(docs, user.uid);

        const activeTransactionDocs = getActiveTransactionDocs(docs);
        const pendingRequirement = newestDoc(activeTransactionDocs, d => d.type === "requirement_request" && (d.requirementStatus || "waiting_customer") === "waiting_customer");
        currentChatContext.activeTransactionId = getLatestBookingCard(activeTransactionDocs)?.transactionId || getLatestBookingCard(activeTransactionDocs)?.bookingId || pendingRequirement?.transactionId || pendingRequirement?.bookingId || null;
        updateChatQuickActions(isOwner, pendingRequirement);

        let html = "";
        let previousDay = "";
        docs.forEach((d, index) => {
            const day = chatDayInfo(d);
            if (day.key !== previousDay) {
                html += `<div class="chat-date-divider"><span>${escapeHtml(day.label)}</span></div>`;
                previousDay = day.key;
            }
            const dateStr = d.createdAt && d.createdAt.toDate
                ? d.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Just now";

            const replyDateStr = d.repliedAt && d.repliedAt.toDate
                ? d.repliedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Replied";

            if (d.type === "system_update") {
                html += renderSystemUpdate(d, dateStr);
                return;
            }

            const pinnedHistory = renderPinnedTransactionHistory(d, dateStr, chatDeskOrders);
            if (pinnedHistory !== null) { html += pinnedHistory; return; }

            if (d.type === "booking_card") {
                const status = d.bookingStatus || d.status || "pending";
                const meta = getRequestMeta(d.requestType || "booking");
                const side = getCardSide(d, user.uid, isOwner, "customer");
                const isActiveBookingCard = activeTransactionDocs.some(x => x.id === d.id || x.bookingId === d.bookingId || x.transactionId === d.transactionId);
                const inlineProgressHtml = ""; // Current actions are pinned above the conversation.

                const outputIcon = {table_reservation:'utensils',food_reservation:'package-check',pickup_order:'shopping-basket',delivery_order:'bike',advance_order:'calendar-days'}[meta.key] || 'calendar-days';
                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card" style="background:var(--ui-surface); border:1px solid ${meta.light}; border-radius:18px; overflow:hidden; max-width:88%; min-width:285px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div class="request-output-header">
                                <span class="request-output-kind"><i data-lucide="${outputIcon}" aria-hidden="true"></i><span>${escapeHtml(meta.shortLabel)}</span></span>
                                <span class="status-badge status-${escapeHtml(status)}">${escapeHtml(status.replace(/_/g, " "))}</span>
                            </div>

                            <div style="padding:14px;">
                                ${d.placeName ? `<p class="request-output-store" data-no-translate>${escapeHtml(d.placeName)}</p>` : ''}
                                ${renderRequestDetailRows(d)}

                                ${inlineProgressHtml}

                                ${isOwner && status === "pending" ? `
                                    <div style="display:flex; gap:8px; margin-top:14px;">
                                        <button onclick="window.updateBookingFromChat('${d.bookingId}', '${d.id}', 'rejected')" style="flex:1; border:none; background:#fee2e2; color:#991b1b; padding:9px; border-radius:10px; font-weight:800; cursor:pointer;">Reject</button>
                                        <button onclick="window.updateBookingFromChat('${d.bookingId}', '${d.id}', 'accepted')" style="flex:1; border:none; background:#dcfce7; color:#166534; padding:9px; border-radius:10px; font-weight:800; cursor:pointer;">Accept Request</button>
                                    </div>
                                ` : ""}

                                ${isOwner ? renderBookingNextAction(d) : ""}

                                ${(d.paymentMethod || d.paymentType || d.paymentStatus || d.paymentReference || d.paymentProofPath || d.paymentProofUrl || d.amount) ? renderPaymentFlowCard(d, isOwner) : ""}

                                ${isOwner && status === "payment_submitted" ? `
                                    <div class="payment-owner-review" style="margin-top:12px; background:var(--ui-success-bg); border:1px solid var(--ui-success-line); border-radius:12px; padding:12px;">
                                        <div style="font-size:13px; font-weight:900; color:#92400e; margin-bottom:8px;">Payment details submitted — please review</div>
                                        ${(d.paymentProofPath || d.paymentProofUrl) ? `<img ${d.paymentProofPath ? `data-proof-booking="${escapeHtml(d.bookingId || "")}" data-proof-version="${escapeHtml(d.paymentProofPath || "")}"` : `src="${escapeHtml(safeImageUrl(d.paymentProofUrl))}"`} alt="Payment proof" style="width:100%; border-radius:8px; border:1px solid #fde68a; margin-bottom:10px;" loading="lazy" />` : `<div style="font-size:12px; color:#92400e;">Receipt image is optional. Verify the submitted reference against your actual account.</div>`}
                                        <div class="payment-review-actions" style="display:flex; gap:8px;">
                                            <button onclick="window.reviewPaymentProof('${d.bookingId}', '${d.id}', 'resubmit')" style="flex:1; border:1px solid #fca5a5; background:var(--ui-surface); color:#991b1b; padding:9px; border-radius:10px; font-weight:800; cursor:pointer;">Decline payment</button>
                                            <button onclick="window.reviewPaymentProof('${d.bookingId}', '${d.id}', 'confirm')" style="flex:1; border:none; background:#16a34a; color:#fff; padding:9px; border-radius:10px; font-weight:800; cursor:pointer;">Accept payment</button>
                                        </div>
                                    </div>
                                ` : ""}

                                ${!isOwner && (d.paymentProofPath || d.paymentProofUrl) ? `
                                    <div style="margin-top:10px;">
                                        <img ${d.paymentProofPath ? `data-proof-booking="${escapeHtml(d.bookingId || "")}" data-proof-version="${escapeHtml(d.paymentProofPath || "")}"` : `src="${escapeHtml(safeImageUrl(d.paymentProofUrl))}"`} alt="Payment proof" style="width:100%; border-radius:10px; border:1px solid #e2e8f0;" loading="lazy" />
                                    </div>
                                ` : ""}

                                ${!isOwner && ["fulfilled", "delivered"].includes(status) ? `
                                    <button onclick="window.confirmReceivedFromChat('${d.bookingId}', '${d.id}', '${d.placeId}')" style="margin-top:14px; width:100%; border:none; background:#dcfce7; color:#166534; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">${escapeHtml(meta.confirmLabel)}</button>
                                ` : ""}

                                ${status === "received" ? `
                                    <div style="margin-top:12px; font-size:12px; color:#5b21b6; font-weight:800;">Transaction completed. Feedback can now be submitted.</div>
                                ` : ""}

                                <div style="font-size:10px; color:var(--ui-muted); margin-top:10px;">${dateStr}</div>
                            </div>
                        </div>
                    </div>
                `;

                return;
            }

            if (d.type === "requirement_request") {
                const status = d.requirementStatus || "waiting_customer";
                const side = getCardSide(d, user.uid, isOwner, "owner");

                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card" style="background:var(--ui-surface); border:1px solid var(--ui-success-line); border-radius:18px; overflow:hidden; max-width:88%; min-width:280px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div style="background:${d.requestType === 'delivery_order' ? '#0ea5e9' : 'var(--ui-primary,#237e72)'}; color:white; padding:12px 14px; font-weight:800;">${d.requestType === 'delivery_order' ? '🛵 Delivery Details Ready' : '📋 Requirements Needed'}</div>

                            <div style="padding:14px; font-size:13px; color:var(--ui-ink);">
                                <div><b>Status:</b> ${makeBadge(status)}</div>
                                <div style="margin-top:8px;"><b>Business requested:</b></div>
                                ${renderRequirementList(d.requirements)}

                                ${d.amount ? `<div style="margin-top:8px;"><b>Amount:</b> ₱${escapeHtml(d.amount)}</div>` : ""}

                                ${d.acceptedPaymentMethods?.length ? `
                                    <div style="margin-top:8px;"><b>Accepted MOP:</b> ${escapeHtml(d.acceptedPaymentMethods.join(", "))}</div>
                                ` : ""}

                                ${d.notes ? `
                                    <div style="margin-top:8px; background:#f8fafc; padding:8px; border-radius:10px;">${escapeHtml(d.notes)}</div>
                                ` : ""}

                                ${!isOwner && status === "waiting_customer" && (!d.canonicalRequirements || !deskOrder(d.bookingId) || deskOrder(d.bookingId).status === "accepted") ? `
                                    <button onclick="window.openRequirementResponseModal('${d.id}')" style="margin-top:12px; width:100%; border:none; background:var(--ui-accent-soft); color:#3730a3; padding:10px; border-radius:10px; font-weight:800; cursor:pointer;">Submit Requirements</button>
                                ` : ""}

                                ${!isOwner && status === "submitted" ? `
                                    <div style="margin-top:12px; color:#166534; font-size:12px; font-weight:800;">Submitted. Waiting for business confirmation.</div>
                                ` : ""}

                                ${status === "confirmed" ? `
                                    <div style="margin-top:12px; color:#5b21b6; font-size:12px; font-weight:800;">Requirements confirmed by business.</div>
                                ` : ""}

                                <div style="font-size:10px; color:var(--ui-muted); margin-top:10px;">${dateStr} ${receiptHtml(d, user.uid, {})}</div>
                            </div>
                        </div>
                    </div>
                `;

                return;
            }

            if (d.type === "requirement_response") {
                const status = d.requirementStatus || "submitted";
                const side = getCardSide(d, user.uid, isOwner, "customer");

                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card" style="background:var(--ui-surface); border:1px solid #bbf7d0; border-radius:18px; overflow:hidden; max-width:90%; min-width:290px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div style="background:#16a34a; color:white; padding:12px 14px; font-weight:800;">✅ Requirements Submitted</div>
                            <div style="padding:14px; font-size:13px; color:var(--ui-ink);">
                                <div class="requirement-detail-status">${status === "confirmed" ? "Details confirmed — payment is separate" : status === "waived" ? "Requirements waived" : "Details submitted for review"}</div>
                                ${renderRequirementResponseDetails(d, isOwner, dateStr)}
                            </div>
                        </div>
                    </div>
                `;

                return;
            }


            if (d.type === "completion_request") {
                const status = d.transactionStatus || "fulfilled_waiting_customer";
                const side = getCardSide(d, user.uid, isOwner, "owner");
                const isDeliveryCompletion = String(d.requestType || "").toLowerCase() === "delivery_order" || ["preparing", "out_for_delivery", "delivered"].includes(status);
                const statusLabel = status === "preparing" ? "Preparing" : status === "out_for_delivery" ? "Out for Delivery" : status === "delivered" ? "Delivered" : status === "received" ? "Received" : "Fulfilled";
                const header = isDeliveryCompletion ? "🛵 Delivery Tracker" : "✅ Transaction Fulfilled";

                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card" style="background:var(--ui-surface); border:1px solid var(--ui-success-line); border-radius:18px; overflow:hidden; max-width:88%; min-width:280px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div style="background:${isDeliveryCompletion ? "#0ea5e9" : "var(--ui-accent)"}; color:white; padding:12px 14px; font-weight:900;">
                                ${header}
                            </div>

                            <div style="padding:14px; font-size:13px; color:var(--ui-ink);">
                                <div><b>Status:</b> ${status === "received" ? makeBadge("received") : makeBadge(status === "delivered" ? "fulfilled" : status)}</div>

                                <div style="margin-top:10px; color:var(--ui-muted);">
                                    ${status === "preparing" ? "Business is preparing the delivery/order." : status === "out_for_delivery" ? "The order is on the way to the customer." : status === "delivered" ? "Business marked this as delivered. Customer can now confirm received." : status === "received" ? "Transaction confirmed received by customer." : "The business marked this transaction as fulfilled. Please confirm once received/completed."}
                                </div>

                                ${isOwner && status === "preparing" ? `
                                    <button onclick="window.updateTransactionStage('${d.id}', 'out_for_delivery')" style="margin-top:12px; width:100%; border:none; background:#e0f2fe; color:#0369a1; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">Mark Out for Delivery</button>
                                ` : ""}

                                ${isOwner && status === "out_for_delivery" ? `
                                    <button onclick="window.updateTransactionStage('${d.id}', 'delivered')" style="margin-top:12px; width:100%; border:none; background:#dcfce7; color:#166534; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">Mark Delivered</button>
                                ` : ""}

                                ${!isOwner && (status === "delivered" || status === "fulfilled_waiting_customer") ? `
                                    <button onclick="window.confirmTransactionReceived('${d.id}', '${d.placeId}', '${d.bookingId || ""}')"
                                        style="margin-top:12px; width:100%; border:none; background:#dcfce7; color:#166534; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">
                                        Confirm Received
                                    </button>
                                ` : ""}

                                <div style="font-size:10px; color:var(--ui-muted); margin-top:10px;">${dateStr}</div>
                            </div>
                        </div>
                    </div>
                `;

                return;
            }

            if (d.type === "feedback_request") {
                const completedOrder=chatDeskOrders.find(order=>order.id===d.bookingId);
                const submitted=completedOrder?.feedbackSubmittedAt||completedOrder?.feedbackStatus==='feedback_submitted'||currentChatDocsCache.some(item=>item.type==='feedback_response'&&item.bookingId===d.bookingId);
                const status = submitted?'feedback_submitted':d.feedbackStatus || "feedback_waiting";
                const side = getCardSide(d, user.uid, isOwner, "system");

                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card feedback-request-card" style="background:var(--ui-surface); border:1px solid var(--ui-success-line,#bdded1); border-radius:18px; overflow:hidden; max-width:88%; min-width:280px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div style="background:var(--ui-success-bg,#e7f3ed); color:var(--ui-success-ink,#28634b); padding:12px 14px; font-weight:900;">⭐ Rate & Feedback</div>

                            <div style="padding:14px; font-size:13px; color:var(--ui-ink);">
                                <div><b>Status:</b> ${makeBadge(status)}</div>
                                <div style="margin-top:8px;">
                                    Transaction completed. Please rate your experience and send feedback.
                                </div>

                                ${!isOwner && status === "feedback_waiting" ? `
                                    <button onclick="window.openFeedbackModal('${d.placeId}', '${d.bookingId}', '${d.id}')"
                                        style="margin-top:12px; width:100%; border:none; background:var(--ui-primary,#237e72); color:#fff; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">
                                        Rate & Send Feedback
                                    </button>
                                ` : ""}

                                ${status === "feedback_submitted" ? `
                                    <div style="margin-top:12px; color:#166534; font-size:12px; font-weight:800;">
                                        Feedback already submitted. Thank you!
                                    </div>
                                ` : ""}

                                <div style="font-size:10px; color:var(--ui-muted); margin-top:10px;">${dateStr}</div>
                            </div>
                        </div>
                    </div>
                `;

                return;
            }

            if (d.type === "feedback_response") {
                const side = getCardSide(d, user.uid, isOwner, "customer");

                const stars = "⭐".repeat(Number(d.rating || 0));

                html += `
                    <div style="display:flex; justify-content:${side}; width:100%; margin-bottom:14px;">
                        <div class="chat-transaction-card" style="background:var(--ui-surface); border:1px solid #fde68a; border-radius:18px; overflow:hidden; max-width:88%; min-width:280px; box-shadow:0 6px 18px rgba(15,23,42,0.08);">
                            <div style="background:var(--ui-success-bg); color:var(--ui-success-ink); padding:12px 14px; font-weight:900;">🌟 Customer Feedback</div>

                            <div style="padding:14px; font-size:13px; color:var(--ui-ink); display:grid; gap:8px;">
                                <div><b>Rating:</b> ${escapeHtml(stars)} (${escapeHtml(String(d.rating || "N/A"))}/5)</div>
                                <div><b>Satisfaction:</b> ${escapeHtml(d.satisfaction || "N/A")}</div>
                                <div><b>Feedback:</b> ${escapeHtml(d.feedback || "No written feedback.")}</div>
                                <div style="font-size:10px; color:var(--ui-muted); margin-top:4px;">${dateStr}</div>
                            </div>
                        </div>
                    </div>
                `;

                return;
            }

            if (d.type === "text" && d.senderUid) {
                const previous = docs[index - 1];
                const grouped = previous?.type === "text" && previous.senderUid === d.senderUid
                    && chatDayInfo(previous).key === day.key && msgMillis(d) - msgMillis(previous) < 120000;
                html += renderTextBubble(d, user.uid, dateStr, { grouped });
                return;
            }

            html += renderLegacyMessage(d, isOwner, dateStr, replyDateStr);
        });

        const prevTop = listWrap.scrollTop;
        const prevH = listWrap.scrollHeight;
        const wasAtBottom = (prevH - prevTop - listWrap.clientHeight) < 90;

        listWrap.innerHTML = html;
        listWrap.querySelectorAll('[data-auto-menu]').forEach(button=>button.onclick=async()=>{
            const id=button.dataset.autoMenu;
            if(button.disabled || !id)return;
            // Keep the chat and draft intact: the native menu dialog opens above it.
            // Use the same real Firestore-backed menu as Business Hub and Vici AI.
            button.disabled=true;
            const original=button.textContent;
            button.textContent='Opening menu…';
            try {
                if(!window.ViciCommerce?.openMenu)throw new Error('Menu viewer is unavailable. Reload the page and try again.');
                await window.ViciCommerce.openMenu(id);
            }catch(error){
                console.warn('Unable to show auto-reply menu:',error);
                window.showToast?.('Could not open the menu. Please try again.','error');
            }finally{
                if(button.isConnected){button.disabled=false;button.textContent=original;}
            }
        });

        if (wasAtBottom || prevH === 0) {
            listWrap.scrollTop = listWrap.scrollHeight;
        } else {
            listWrap.scrollTop = prevTop;
        }
};
}


            

// =========================================
// 🚀 SYSTEM PUSH NOTIFICATIONS
// =========================================
window.requestPushPermission = function() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
        Notification.requestPermission();
    }
};

window.sendSystemNotif = function(title, bodyText) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body: bodyText, icon: "favicon.ico" });
    }
};

// =========================================
// 🔔 REAL-TIME SOUND NOTIFICATION
// =========================================
window.playNotifSound = function () {
    const audio = new Audio('notif.mp3');
    audio.volume = 1.0;
    audio.play().catch(e => console.log("Audio auto-play blocked:", e));
};

// ==========================================
// 🔔 IN-APP NOTIFICATION POPUPS (top-right) + FLOATING ORDER WINDOW
// ==========================================
window.vicinifyNotify = function(title, body) {
    const heading=String(title || 'Notification'),message=String(body || '');
    const notice=window.vicinifyToast(heading+'\n'+message,'info');
    notice.querySelector('.v-toast-title').textContent=heading;
    const text=notice.querySelector('.v-toast-text');text.textContent=message;text.hidden=!message;
    return notice;
};

// Persistent, actionable owner alert: sound alone is not enough.
// Kept separate from the short-lived toast queue so a second toast cannot
// silently displace a stamp request before the owner sees it.
window.showOwnerSukiAlert = function(customerName, placeName) {
    let notice = document.getElementById('ownerSukiNotification');
    if (!notice) {
        notice = document.createElement('section');
        notice.id = 'ownerSukiNotification';
        notice.className = 'owner-suki-notification';
        notice.setAttribute('role', 'alert');
        notice.setAttribute('aria-label', 'New Suki stamp request');
        const head = document.createElement('div');
        head.className = 'owner-suki-notification-head';
        const title = document.createElement('strong');
        title.textContent = 'New Suki stamp request';
        const dismiss = document.createElement('button');
        dismiss.type = 'button';
        dismiss.className = 'owner-suki-notification-dismiss';
        dismiss.textContent = '×';
        dismiss.setAttribute('aria-label', 'Dismiss Suki notification');
        dismiss.addEventListener('click', () => notice.remove());
        head.append(title, dismiss);
        const body = document.createElement('p');
        body.className = 'owner-suki-notification-body';
        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'owner-suki-notification-action';
        action.textContent = 'View request · Approve / Reject';
        action.addEventListener('click', () => {
            notice.remove();
            window.DashboardPage?.openSukiInbox?.();
        });
        notice.append(head, body, action);
        document.body.appendChild(notice);
    }
    const name = String(customerName || 'A customer').slice(0, 100);
    const place = String(placeName || 'your establishment').slice(0, 100);
    notice.querySelector('.owner-suki-notification-body').textContent =
        `${name} wants a stamp at ${place}.`;
    return notice;
};

// Reverse geocoding via OpenStreetMap Nominatim (free, no API key,
// no Firebase cost). User-triggered lookups only (pin drags, button
// taps) — never bulk. Resolves { barangay, city, province, road,
// label } or null on any failure; callers fall back to coordinates.
window.reverseGeocode = async function (lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!res.ok) return null;
        const data = await res.json();
        const a = data.address || {};
        const cleanBrgy = String(a.village || a.suburb || a.neighbourhood || a.quarter || "").replace(/^Barangay\s+/i, "").trim();
        const city = a.city || a.town || a.municipality || "";
        const province = a.state || "";
        const road = [a.house_number, a.road].filter(Boolean).join(" ").trim();
        const parts = [road, cleanBrgy ? `Brgy. ${cleanBrgy}` : "", city, province].filter(Boolean);
        return { barangay: cleanBrgy, city, province, road, label: parts.join(", ") || data.display_name || "" };
    } catch (e) { return null; }
};

const FLOATING_ORDER_STATES = {
    pending: "Waiting for approval",
    accepted: "Accepted",
    payment_submitted: "Payment sent",
    payment_confirmed: "Payment confirmed",
    preparing: "Preparing your order",
    ready: "Your order is ready",
    ready_for_pickup: "Ready for pickup"
};

const FOW_STATUS_DOTS = {
    pending: "#f97316",
    accepted: "var(--ui-accent)",
    payment_submitted: "#d97706",
    payment_confirmed: "#d97706",
    preparing: "#ea580c",
    ready: "#16a34a",
    ready_for_pickup: "#16a34a"
};

window.FloatingOrderWindow = {
    _active: [],
    _open: false,
    render(bookings) {
        let el = document.getElementById("floatingOrderWindow");
        const active = (bookings || [])
            .filter(d => FLOATING_ORDER_STATES[String(d.status || "").toLowerCase()])
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        const onDashboard = document.getElementById("page-dashboard")?.classList.contains("active");
        this._active = active;
        if (!active.length || onDashboard || !AppState.user) {
            if (el) el.classList.add("hidden");
            this._open = false;
            this._renderPanel();
            return;
        }
        if (!el) {
            el = document.createElement("button");
            el.id = "floatingOrderWindow";
            el.type = "button";
            el.addEventListener("click", () => window.FloatingOrderWindow.toggle());
            document.body.appendChild(el);
        }
        const latest = active[0];
        el.innerHTML = "";
        const dot = document.createElement("span"); dot.className = "fow-dot";
        const main = document.createElement("span"); main.className = "fow-main";
        const name = document.createElement("b"); name.textContent = latest.placeName || "Your order";
        const sub = document.createElement("span");
        sub.textContent = FLOATING_ORDER_STATES[String(latest.status || "pending").toLowerCase()];
        main.append(name, sub);
        el.append(dot, main);
        if (active.length > 1) {
            const count = document.createElement("span");
            count.className = "fow-count";
            count.textContent = String(active.length);
            el.appendChild(count);
        }
        el.classList.remove("hidden");
        this._renderPanel();
    },
    toggle() {
        this._open = !this._open;
        this._renderPanel();
    },
    _renderPanel() {
        let panel = document.getElementById("floatingOrderPanel");
        if (!this._open || !this._active.length) {
            if (panel) panel.classList.add("hidden");
            return;
        }
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "floatingOrderPanel";
            document.body.appendChild(panel);
            if (!window.__fowOutsideBound) {
                window.__fowOutsideBound = true;
                document.addEventListener("click", (e) => {
                    const p = document.getElementById("floatingOrderPanel");
                    const pill = document.getElementById("floatingOrderWindow");
                    if (p && !p.classList.contains("hidden") && !p.contains(e.target) && !(pill && pill.contains(e.target))) {
                        window.FloatingOrderWindow._open = false;
                        p.classList.add("hidden");
                    }
                });
            }
        }
        panel.innerHTML = "";
        const head = document.createElement("div");
        head.className = "fow-panel-head";
        const title = document.createElement("b");
        title.textContent = `Active Orders (${this._active.length})`;
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "fow-panel-close";
        closeBtn.textContent = "×";
        closeBtn.setAttribute("aria-label", "Close");
        closeBtn.addEventListener("click", () => window.FloatingOrderWindow.toggle());
        head.append(title, closeBtn);
        panel.appendChild(head);
        this._active.forEach(d => {
            const st = String(d.status || "pending").toLowerCase();
            const row = document.createElement("button");
            row.type = "button";
            row.className = "fow-row";
            const dot = document.createElement("span");
            dot.className = "fow-dot";
            dot.style.background = FOW_STATUS_DOTS[st] || "#f97316";
            const main = document.createElement("span");
            main.className = "fow-main";
            const name = document.createElement("b");
            name.textContent = d.placeName || "Your order";
            const sub = document.createElement("span");
            sub.textContent = FLOATING_ORDER_STATES[st] || st;
            main.append(name, sub);
            row.append(dot, main);
            row.addEventListener("click", () => {
                window.FloatingOrderWindow._open = false;
                window.FloatingOrderWindow._renderPanel();
                showPage("page-dashboard");
            });
            panel.appendChild(row);
        });
        const foot = document.createElement("button");
        foot.type = "button";
        foot.className = "fow-panel-foot";
        foot.textContent = "Open My Activity";
        foot.addEventListener("click", () => {
            window.FloatingOrderWindow._open = false;
            window.FloatingOrderWindow._renderPanel();
            showPage("page-dashboard");
        });
        panel.appendChild(foot);
        panel.classList.remove("hidden");
    },
    hide() {
        const el = document.getElementById("floatingOrderWindow");
        if (el) el.classList.add("hidden");
        this._open = false;
        const panel = document.getElementById("floatingOrderPanel");
        if (panel) panel.classList.add("hidden");
    }
};

// ==========================================
// 🔴 REAL-TIME GLOBAL NOTIFICATIONS LOGIC
// ==========================================
window.GlobalNotifier = (() => {
    let unsubs = [];
    // Transition tracking for in-app popups (baselines reset on stop).
    const prevBookingStatus = new Map();
    let prevStampCounts = null;
    const ownerSukiPendingByChunk = new Map();
    // Session cap for customer receipt writes (see markDocsCustomerRead).
    const _customerReadAttempted = new Set();

    function updateBadge(id, count) {
        const badge = document.getElementById(id);
        if (!badge) return;

        const n = Number(count || 0);
        if (n > 0) {
            badge.textContent = n > 9 ? "9+" : String(n);
            badge.classList.remove("hidden");
            badge.style.display = "flex";
        } else {
            badge.textContent = "0";
            badge.classList.add("hidden");
            badge.style.display = "none";
        }
    }

    function hasReadBy(data, fieldName, uid) {
        return Array.isArray(data[fieldName]) && data[fieldName].includes(uid);
    }

    function isOwnerUnreadTransaction(data, uid) {
        if (!uid) return false;
        if (hasReadBy(data, "ownerReadBy", uid)) return false;
        const deletedBy = data.deletedBy || [];
        if (deletedBy.includes(uid) || deletedBy.includes("owner_deleted")) return false;
        return true;
    }

    function isOwnerUnreadMessage(data, uid) {
        if(!isConversationMessage(data))return false;
        if (!uid) return false;
        if (hasReadBy(data, "ownerReadBy", uid)) return false;
        if (data.senderUid === uid || data.createdBy === uid || data.userId === uid) return false;
        const deletedBy = data.deletedBy || [];
        if (deletedBy.includes(uid) || deletedBy.includes("owner_deleted")) return false;
        return true;
    }

    function isCustomerUnreadTransaction(data, uid) {
        if (!uid) return false;
        if (hasReadBy(data, "customerReadBy", uid)) return false;
        const status = String(data.status || data.bookingStatus || "pending").toLowerCase();
        if (status === "pending") return false;
        return true;
    }

    function isCustomerUnreadMessage(data, uid) {
        if(!isConversationMessage(data))return false;
        if (!uid) return false;
        if (hasReadBy(data, "customerReadBy", uid)) return false;
        if (data.senderUid === uid || data.createdBy === uid) return false;
        if (data.reply && String(data.reply).trim() !== "") return true;
        return data.senderUid && data.senderUid !== uid;
    }

    async function markDocsCustomerRead(collectionName, docs) {
        const user = window.auth?.currentUser;
        if (!user || !Array.isArray(docs) || docs.length === 0) return;

        const batch = window.db.batch();
        let writes = 0;
        docs.forEach(doc => {
            if (!doc?.id) return;
            // Guard (mirrors markDocsOwnerRead): never rewrite a doc that
            // already carries this user's read mark — the write carries a
            // fresh serverTimestamp, so an unguarded rewrite re-fires the
            // listener and can feed a write loop.
            if (Array.isArray(doc.customerReadBy) && doc.customerReadBy.includes(user.uid)) return;
            if (_customerReadAttempted.has(collectionName + ":" + doc.id)) return;
            _customerReadAttempted.add(collectionName + ":" + doc.id);
            batch.update(window.db.collection(collectionName).doc(doc.id), {
                customerReadBy: firebase.firestore.FieldValue.arrayUnion(user.uid),
                customerReadAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            writes++;
        });
        if (!writes) return;
        await batch.commit();
    }

    window.setNotifBadge = updateBadge;
    window.isCustomerUnreadTransaction = isCustomerUnreadTransaction;
    window.isCustomerUnreadMessage = isCustomerUnreadMessage;
    window.markDocsCustomerRead = markDocsCustomerRead;

    function refreshDashBadge() {
        const ownerTotal = (window._dashPendingCount || 0) + (window._dashMsgCount || 0) + (window._dashSukiCount || 0);
        const custTotal = (window._settingsTransactionCount || 0) + (window._settingsChatCount || 0);
        // One-tab rule: for standard users, the hub tab carries their counts.
        const total = ownerTotal + (AppState.userProfile?.role === "user" ? custTotal : 0);
        updateBadge("navBadgeDash", total);
    }

    function refreshSettingsBadge() {
        const total = (window._settingsTransactionCount || 0) + (window._settingsChatCount || 0);
        updateBadge("navBadgeSettings", AppState.userProfile?.role === "user" ? 0 : total);
        refreshDashBadge();
    }

    function stop() {
        unsubs.forEach(u => {
            if (typeof u === "function") u();
        });
        unsubs = [];

        window._dashPendingCount = 0;
        window._dashMsgCount = 0;
        window._dashSukiCount = 0;
        ownerSukiPendingByChunk.clear();
        document.getElementById('ownerSukiNotification')?.remove();
        window._settingsTransactionCount = 0;
        window._settingsChatCount = 0;

        updateBadge("navBadgeDash", 0);
        updateBadge("navBadgeSettings", 0);
        prevBookingStatus.clear();
        prevStampCounts = null;
        _customerReadAttempted.clear();
        window.FloatingOrderWindow?.hide();
    }

    async function start(user) {
        stop();
        if (!user) return;

        let isCustomerBookingInit = true;
        const custBookUnsub = window.ViciData.customerFeed("bookings", user.uid, snap => {
                let unread = 0;
                let hasNew = false;

                snap.docChanges().forEach(change => {
                    const data = change.doc.data();
                    if (!isCustomerBookingInit && change.type === "added" && isCustomerUnreadTransaction(data, user.uid)) hasNew = true;
                });

                snap.forEach(doc => {
                    if (isCustomerUnreadTransaction(doc.data(), user.uid)) unread++;
                });

                window._settingsTransactionCount = unread;
                refreshSettingsBadge();

                if (hasNew) {
                    window.playNotifSound?.();
                                        window.sendSystemNotif?.("Transaction Update", "A business updated your request.");
                }

                // In-app popups on status transitions + floating order window.
                const docsArr = snap.docs.map(d => ({ ...d.data(), id: d.id }));
                window._custBookingDocs = docsArr;
                docsArr.forEach(d => {
                    const prev = prevBookingStatus.get(d.id);
                    if (!isCustomerBookingInit && prev !== undefined && prev !== d.status) {
                        window.vicinifyNotify?.("Order update", `${d.placeName || "Establishment"} — ${String(d.status || "").replace(/_/g, " ").toUpperCase()}`);
                        window.playNotifSound?.();
                    }
                    prevBookingStatus.set(d.id, d.status);
                });
                window.FloatingOrderWindow?.render(docsArr);

                isCustomerBookingInit = false;
            }, err => window.handleFirestoreError(err));
        unsubs.push(custBookUnsub);

        let isCustomerMsgInit = true;
        const custMsgUnsub = window.ViciData.customerFeed("messages", user.uid, snap => {
                let unread = 0;
                let hasNew = false;

                snap.docChanges().forEach(change => {
                    const data = change.doc.data();
                    if (!isCustomerMsgInit && change.type === "added" && isCustomerUnreadMessage(data, user.uid)) hasNew = true;
                });

                snap.forEach(doc => {
                    if (isCustomerUnreadMessage(doc.data(), user.uid)) unread++;
                });
                markIncomingDelivered(snap.docs, user.uid);

                window._settingsChatCount = unread;
                refreshSettingsBadge();

                if (hasNew) {
                    window.playNotifSound?.();
                                        window.sendSystemNotif?.("New Message", "A business sent you a message.");
                }

                // In-app popup when the business replies (unless chat is open).
                snap.docChanges().forEach(change => {
                    const data = change.doc.data();
                    if (!isCustomerMsgInit && change.type === "added" && data.senderRole === "owner") {
                        const chatOpen = !document.getElementById("chatModal")?.classList.contains("hidden");
                        if (!chatOpen) window.vicinifyNotify?.("New message", data.placeName || "Establishment");
                    }
                });

                isCustomerMsgInit = false;
            }, err => window.handleFirestoreError(err));
        unsubs.push(custMsgUnsub);

        // Suki stamp popups: toast when a card's stamp count increases.
        const sukiUnsub = window.ViciData.sukiFeed(user.uid, snap => {
                const next = new Map();
                snap.forEach(doc => {
                    const d = doc.data();
                    const stamps = d.stamps ?? d.stampCount ?? 0;
                    next.set(doc.id, stamps);
                    if (prevStampCounts && prevStampCounts.has(doc.id) && stamps > prevStampCounts.get(doc.id)) {
                        const required = d.requiredStamps ?? d.stampsRequired ?? 10;
                        window.vicinifyNotify?.("New stamp", `You now have ${stamps}/${required} stamps.`);
                        window.playNotifSound?.();
                    }
                });
                prevStampCounts = next;
            }, () => {});
        unsubs.push(sukiUnsub);

        // Plain customers own no establishments: skip the owned-places
        // query (and the owner badge listeners) entirely for them.
        if (AppState.userProfile?.role === "user") {
            refreshDashBadge();
            return;
        }

        try {
            const ownedSnap = await window.db.collection("places")
                .where("owner_uid", "==", user.uid)
                .limit(20)
                .get();

            const placeIds = ownedSnap.docs.map(d => d.id);
            if (window.auth?.currentUser?.uid !== user.uid) return;

            const chunks = [];
            for (let i = 0; i < placeIds.length; i += 10) chunks.push(placeIds.slice(i, i + 10));

            const ownerBookingCounts = new Map();
            const ownerMessageCounts = new Map();

            chunks.forEach((chunk, idx) => {
                let isBookInit = true;
                const bookUnsub = window.db.collection("bookings")
                    .where("placeId", "in", chunk)
                    .orderBy("createdAt", "desc")
                    .limit(10)
                    .onSnapshot(snap => {
                        let unread = 0;
                        let hasNew = false;

                        snap.docChanges().forEach(change => {
                            const data = change.doc.data();
                            if (!isBookInit && change.type === "added" && isOwnerUnreadTransaction(data, user.uid)) hasNew = true;
                        });

                        snap.forEach(doc => {
                            if (isOwnerUnreadTransaction(doc.data(), user.uid)) unread++;
                        });

                        ownerBookingCounts.set(idx, unread);
                        window._dashPendingCount = Array.from(ownerBookingCounts.values()).reduce((a, b) => a + b, 0);
                        refreshDashBadge();

                        if (hasNew) {
                            window.vicinifyNotify?.("New transaction", "A customer sent a request.");
                            window.playNotifSound?.();
                                                        window.sendSystemNotif?.("New Transaction", "A customer sent or updated a request.");
                        }

                        isBookInit = false;
                    }, err => window.handleFirestoreError(err));
                unsubs.push(bookUnsub);

                let isMsgInit = true;
                const msgUnsub = window.db.collection("messages")
                    .where("placeId", "in", chunk)
                    .orderBy("createdAt", "desc")
                    .limit(10)
                    .onSnapshot(snap => {
                        let unread = 0;
                        let hasNew = false;

                        snap.docChanges().forEach(change => {
                            const data = change.doc.data();
                            if (!isMsgInit && change.type === "added" && isOwnerUnreadMessage(data, user.uid)) hasNew = true;
                        });

                        snap.forEach(doc => {
                            if (isOwnerUnreadMessage(doc.data(), user.uid)) unread++;
                        });
                        markIncomingDelivered(snap.docs, user.uid);

                        ownerMessageCounts.set(idx, unread);
                        window._dashMsgCount = Array.from(ownerMessageCounts.values()).reduce((a, b) => a + b, 0);
                        refreshDashBadge();

                        if (hasNew) {
                            window.vicinifyNotify?.("New message", "A customer sent you a message.");
                            window.playNotifSound?.();
                                                        window.sendSystemNotif?.("New Customer Message", "A customer sent you a message.");
                        }

                        isMsgInit = false;
                    }, err => window.handleFirestoreError(err));
                unsubs.push(msgUnsub);

                // Owner stamp requests: same global treatment — popup on
                // ANY page, not only while the Business Hub is open.
                let isStampReqInit = true;
                const stampUnsub = window.db.collection("stamp_requests")
                    .where("placeId", "in", chunk)
                    .limit(100)
                    .onSnapshot(snap => {
                        if (window.auth?.currentUser?.uid !== user.uid) return;
                        let pending = 0;
                        snap.forEach(doc => {
                            if ((doc.data().status || 'pending') === 'pending') pending++;
                        });
                        ownerSukiPendingByChunk.set(idx, pending);
                        window._dashSukiCount = [...ownerSukiPendingByChunk.values()].reduce((a,b) => a+b, 0);
                        refreshDashBadge();
                        snap.docChanges().forEach(change => {
                            const data = change.doc.data();
                            if (!isStampReqInit && change.type === "added" && (data.status || "pending") === "pending") {
                                window.showOwnerSukiAlert?.(data.customerName, data.placeName);
                                window.playNotifSound?.();
                                window.sendSystemNotif?.("Stamp request", `${data.customerName || "A customer"} is requesting a stamp.`);
                            }
                        });
                        isStampReqInit = false;
                    }, err => window.handleFirestoreError(err));
                unsubs.push(stampUnsub);
            });
        } catch (e) {
            console.error("Error setting up owner notifications:", e);
        }

        // Admin: live popup when a new establishment is waiting for
        // approval. The first snapshot is the baseline — silent, so old
        // pending places never flood the admin on login.
        if (AppState.userProfile?.role === "admin" || user.uid === "Z45NZhQTgsTUX79WJ5ksCH8N3c02") {
            let isPendingInit = true;
            const pendingUnsub = window.db.collection("places")
                .where("approval_status", "==", "pending")
                .limit(20)
                .onSnapshot(snap => {
                    if (!isPendingInit) {
                        snap.docChanges().forEach(change => {
                            if (change.type === "added") {
                                const d = change.doc.data();
                                const placeName = d.name || "An establishment";
                                window.vicinifyNotify?.("New establishment", `${placeName} is waiting for approval.`);
                                window.playNotifSound?.();
                                window.sendSystemNotif?.("New establishment", `${placeName} is waiting for approval.`);
                            }
                        });
                    }
                    isPendingInit = false;
                }, err => window.handleFirestoreError(err));
            unsubs.push(pendingUnsub);
        }
    }

    return {
        start,
        stop,
        refreshDashBadge,
        refreshSettingsBadge,
        updateBadge,
        isCustomerUnreadTransaction,
        isCustomerUnreadMessage,
        markDocsCustomerRead
    };
})();

// =========================================
// ❤️ GLOBAL FAVORITES LOGIC
// =========================================
window.toggleFavorite = async function (placeId, btn) {
    const user = window.auth?.currentUser;
    if (!user) return window.alert("Please log in to save favorites.");

    if (!user.emailVerified) {
        const ans = await window.vConfirm(
            "Account Not Verified", 
            "You must verify your email address to save favorites. Would you like us to resend the verification link?", 
            "Resend Link", 
            false
        );
        if (ans) window.resendVerificationEmail();
        return;
    }

    if (btn?.disabled) return;
    if (btn) btn.disabled = true;
    const userId = user.uid;
    const favRef = window.db.collection("favorites").doc(`${userId}_${placeId}`);

    try {
        const doc = await favRef.get();
        if (doc.exists) {
            await favRef.delete();
            if (btn) { btn.classList.remove("active"); btn.setAttribute("aria-pressed", "false"); btn.setAttribute("aria-label", "Save establishment"); }
            window.alert("Removed from favorites.");
        } else {
            const placeSnap = await window.db.collection("places").doc(placeId).get();
const placeData = placeSnap.exists ? placeSnap.data() : {};
if (!placeSnap.exists || placeData.owner_uid === userId) {
    window.showToast?.('You cannot favorite your own establishment.', 'info');
    return;
}

await favRef.set({
    userId,
    placeId,

    placeName: placeData.name || "Unknown Establishment",
    placeAddress: placeData.address || placeData.addr || placeData.brgy || placeData.barangay || "Lipa City",
    placeCategory: placeData.category || placeData.cat || "default",

    createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
            if (btn) { btn.classList.add("active"); btn.setAttribute("aria-pressed", "true"); btn.setAttribute("aria-label", "Remove from favorites"); }
            window.alert("Successfully added to favorites!");
        }
    } catch (e) {
        console.error("Favorite Error:", e);
        window.alert("Error updating favorites. Please try again later.");
    } finally {
        if (btn) btn.disabled = false;
    }
};

// =========================================
// ⭐ GLOBAL RATING LOGIC (WITH ANTI-SPAM)
// =========================================
let isRatingProcessing = false;

window.submitRating = async function (placeId, score) {
    if (isRatingProcessing || !Number.isInteger(score) || score < 1 || score > 5) return;
    isRatingProcessing = true;
    // Immediate visual feedback while server validation and the transaction run.
    // Never announce success until the backend acknowledges the write.
    const panel = document.getElementById('starInputContainer');
    const livePanel = panel?.closest('.place-rating-panel');
    const samePlace = () => livePanel?.isConnected && window.currentPlaceReviewId === placeId;
    const prior = [...(panel?.querySelectorAll('.star-btn') || [])].map(b => b.classList.contains('active'));
    const buttons = [...(panel?.querySelectorAll('.star-btn') || [])];
    let status = livePanel?.querySelector('.place-rating-save-status');
    if (!status && livePanel) {
        status = document.createElement('p');
        status.className = 'place-rating-save-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        panel?.insertAdjacentElement('afterend', status);
    }
    buttons.forEach((button, index) => { button.classList.toggle('active', index < score); button.disabled = true; });
    if (status) status.textContent = 'Saving your rating…';
    try {
        await window.ViciData.command('review', { action:'rate', placeId, rating:score });
        window.invalidatePlacesCache?.();
        if (samePlace()) {
            if (status) status.textContent = `Saved: ${score} ${score === 1 ? 'star' : 'stars'}.`;
            const heading = livePanel?.querySelector('h4');
            if (heading) heading.textContent = 'Your Rating';
        }
        window.showToast?.('Rating saved.', 'success');
    } catch (error) {
        if (samePlace()) {
            buttons.forEach((button, index) => button.classList.toggle('active', !!prior[index]));
            if (status) status.textContent = 'Could not save. Please try again.';
        }
        window.showToast?.(error.message || 'Rating could not be saved.', 'error');
    } finally {
        if (samePlace()) buttons.forEach(button => { button.disabled = false; });
        isRatingProcessing = false;
    }
};

// =========================================
// 📋 CONNECTED LIST VIEW RENDERER (PREMIUM UI V2)
// =========================================
window.renderListView = function(filteredPlaces) {
    const listContainer = document.getElementById("listViewContainer");
    if (!listContainer) return;

    listContainer._places = new Map((filteredPlaces || []).map(place => [String(place.id), place]));
    if (!filteredPlaces || filteredPlaces.length === 0) {
        listContainer.innerHTML = `<div class="muted" style="text-align:center; padding: 2rem;" data-i18n="No establishments found. Try adjusting the search radius or category.">No establishments found. Try adjusting the search radius or category.</div>`;
        return;
    }

    const fmtDist = (m) => (m == null || isNaN(m)) ? "Nearby" : (m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`);

    let html = '';
    filteredPlaces.forEach(place => {
        let distText = fmtDist(place._distance);
        const freshness = window.getViciFreshnessStatus?.(place) || { className: "freshness-active", label: "Fresh", shortLabel: "Fresh", tone: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };

        const currentStatus = window.ViciBusinessHours.getState(place).status;
        let statusText = "Closed";
        let statusColor = "#475569";
        let statusBorder = "#e2e8f0";
        let statusBg = "#f8fafc";
        let statusDot = "#94a3b8";
        if (currentStatus === 'open') {
            statusText = "Open"; statusColor = "#16a34a"; statusBorder = "#bbf7d0"; statusBg = "#f0fdf4"; statusDot = "#22c55e";
        } else if (currentStatus === 'busy') {
            statusText = "Busy"; statusColor = "#b45309"; statusBorder = "#fef08a"; statusBg = "#fefce8"; statusDot = "#eab308";
        }

        // The list thumbnail represents the business identity (logo), not its banner.
        // Never fall back to the cover here: the two uploaded photos have different purposes.
        const profilePhoto = safeImageUrl(place.logoUrl || place.logoURL || place.logo || place.brandLogo || place.brand_logo || place.profileLogo || place.avatarUrl);
        let imgHtml = profilePhoto
            ? `<img src="${escapeHtml(profilePhoto)}" alt="${escapeHtml(place.name || 'Establishment')} profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" loading="lazy" onerror="this.remove()" />`
            : `<div style="width: 100%; height: 100%; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i data-lucide="map-pin" style="color: #cbd5e1; width: 28px; height: 28px;"></i></div>`;

        let ratingHtml = place.avgRating
            ? `<div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #d97706; font-weight: 700;">
                <i data-lucide="star" style="width: 12px; height: 12px; fill: #f59e0b; color:#f59e0b;"></i> ${escapeHtml(String(place.avgRating))} <span style="color:var(--ui-muted); font-weight: normal;">(${escapeHtml(String(place.reviewCount || 0))})</span>
               </div>`
            : `<div style="font-size: 11px; color:var(--ui-muted);">No ratings yet</div>`;

        // FIX ONLY: never show a raw ID/number or the literal word "ADDRESS" as the address
        const rawAddr = String(place.address || place.brgy || place.barangay || "").trim();
        const addrLooksId = /^[a-zA-Z0-9_-]{20,}$/.test(rawAddr) && /[0-9_-]/.test(rawAddr);
        const addrText = (!rawAddr || addrLooksId || rawAddr.toLowerCase() === "address") ? "Lipa City" : rawAddr;

        html += `
        <div class="est-card place-list-card ${freshness.className}" style="background:var(--ui-surface); border: 1px solid #fde047; border-radius: 12px; padding: 16px; margin: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 16px; cursor: pointer;" data-place-card="${escapeHtml(place.id)}">
            <div class="place-list-summary" style="display: flex; gap: 16px; position: relative;">
                <div class="place-list-thumbnail" style="position: relative; width: 72px; height: 72px; flex-shrink: 0; border-radius: 8px; border: 1px solid #f1f5f9;">
                    ${imgHtml}
                </div>
                <div class="place-list-info" style="flex: 1; min-width: 0;">
                    <div class="place-list-heading" style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h3 style="margin: 0; font-size: 16px; font-weight: 800; color:var(--ui-ink); display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${escapeHtml(place.name)} ${place.is_verified ? `<i data-lucide="badge-check" style="width: 16px; height: 16px; color:var(--ui-accent);"></i>` : ''}
                        </h3>
                        <i data-lucide="chevron-right" style="width: 18px; height: 18px; color: #cbd5e1; flex-shrink: 0;"></i>
                    </div>
                    <div class="place-list-meta" style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                        <div style="font-size: 13px; color:var(--ui-muted); text-transform: capitalize;">${escapeHtml(place.category || place.cat || "")}</div>
                        <div style="width: 3px; height: 3px; border-radius: 50%; background: #cbd5e1;"></div>
                        ${ratingHtml}
                        <button type="button" class="place-list-action place-list-menu-trigger" data-action="menu" data-place-id="${escapeHtml(place.id)}"><i data-lucide="book-open"></i> Menu</button>
                    </div>
                    <div class="place-list-badges" style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
                        <span class="place-list-status is-${currentStatus === 'open' ? 'open' : currentStatus === 'busy' ? 'busy' : 'closed'}" style="display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid ${statusBorder}; color: ${statusColor}; background: ${statusBg};">
                            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${statusDot};"></span>
                            <span data-i18n="${statusText}">${statusText}</span>
                        </span>
                        <span style="font-size: 12px; color:var(--ui-muted); display: flex; align-items: center; gap: 4px;">
                            <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> ${distText}
                        </span>
                        <span class="vici-freshness-badge ${freshness.className}" title="${escapeHtml(freshness.label)}" style="background:${freshness.bg}; border-color:${freshness.border}; color:${freshness.tone};">
                            <i data-lucide="${freshness.isInactive ? 'pause-circle' : freshness.level === 'active' ? 'check-circle-2' : 'alert-triangle'}"></i>
                            ${escapeHtml(freshness.shortLabel)}
                        </span>
                    </div>
                    <div data-no-translate class="place-list-address" style="font-size: 11px; color:var(--ui-muted); margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">
                        ${escapeHtml(addrText)}
                    </div>
                </div>
            </div>
            <div class="place-list-actions" style="display: flex; gap: 8px;">
                <button type="button" class="place-list-action" data-action="chat" data-place-id="${escapeHtml(place.id)}" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 8px; background:var(--ui-surface); border: 1px solid #e2e8f0; color:var(--ui-ink); font-size: 13px; font-weight: 600; cursor: pointer;">
                    <i data-lucide="message-square" style="width: 14px; height: 14px;"></i> <span data-i18n="Chat">Chat</span>
                </button>
                <button type="button" class="place-list-action" data-action="booking" data-place-id="${escapeHtml(place.id)}" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 8px; background:var(--ui-surface); border: 1px solid #e2e8f0; color:var(--ui-ink); font-size: 13px; font-weight: 600; cursor: pointer;">
                    <i data-lucide="calendar" style="width: 14px; height: 14px;"></i> <span data-i18n="Request">Request</span>
                </button>
                <button type="button" class="place-list-action" data-action="route" data-place-id="${escapeHtml(place.id)}" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 8px; background: var(--ui-primary); border: none; color: white; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 6px rgba(35,126,114,0.18);">
                    <i data-lucide="send" style="width: 14px; height: 14px;"></i> <span data-i18n="Navigate">Navigate</span>
                </button>
            </div>
        </div>
        `;
    });

    listContainer.innerHTML = html;
    window.PlacePreview?.syncSelection?.();
    if (!listContainer.dataset.actionsBound) {
        listContainer.dataset.actionsBound = "true";
        listContainer.addEventListener("click", (event) => {
            const button = event.target.closest(".place-list-action");
            const card = event.target.closest("[data-place-card]");
            const place = listContainer._places.get(button?.dataset.placeId || card?.dataset.placeCard);
            event.stopPropagation();
            if (!place) return;
            if (!button) { if (window.PlacePreview?.open) window.PlacePreview.open(place); else window.viewPlace(place.id); return; }
            if (button.dataset.action === "menu") window.PlacePreview?.open(place);
            if (button.dataset.action === "favorite") window.toggleFavorite(place.id, button);
            if (button.dataset.action === "chat") window.openChatModal(place.id, place.name || "Establishment");
            if (button.dataset.action === "booking") window.openBookingModal(place.id, place.name || "Establishment");
            if (button.dataset.action === "route") {
                const latitude = Number(place.lat), longitude = Number(place.lng);
                if (Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
                    window.PlacePreview?.close?.();
                    window.toggleView?.("map");
                    window.routeToPlace(latitude, longitude, place.name || "Establishment");
                }
                else window.showToast?.("This establishment has no valid map location.", "error");
            }
        });
    }
    if (window.lucide) window.debouncedIcons?.();
    window.LangManager?.translateDOM?.();
};

// =========================================
// ☁️ FIREBASE STORAGE UPLOADER
// =========================================
window.uploadFileToStorage = async function(file, folderName) {
    if (!file) return null;
    
    try {
        const uniqueFileName = `${folderName}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const storageRef = window.storage.ref().child(uniqueFileName);
        
        const snapshot = await storageRef.put(file);
        
        const downloadURL = await snapshot.ref.getDownloadURL();
        return downloadURL;
    } catch (error) {
        console.error("Storage Upload Error: ", error);
        throw error;
    }
};



// Decode and re-encode image pixels; never store original user-provided bytes.
window.compressImageFile = async function(file, maxWidth = 800, quality = 0.6) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!file || !allowed.includes(file.type)) throw new Error("Only JPG, PNG and WebP photos are allowed.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Photo must be 5 MB or smaller.");
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = [137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
    const webp = String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
    if (!(file.type === "image/jpeg" && jpeg || file.type === "image/png" && png || file.type === "image/webp" && webp)) throw new Error("Invalid photo content.");
    let bitmap, imageObjectUrl = null;
    try {
        if (typeof createImageBitmap === 'function') bitmap = await createImageBitmap(file);
        else {
            imageObjectUrl = URL.createObjectURL(file);
            bitmap = await new Promise((resolve,reject)=>{
                const img = new Image();
                img.onload = ()=>resolve(img);
                img.onerror = ()=>reject(new Error('Photo could not be decoded.'));
                img.src = imageObjectUrl;
            });
        }
    } catch (_) { if(imageObjectUrl) URL.revokeObjectURL(imageObjectUrl); throw new Error('Photo could not be decoded.'); }
    try {
        if (bitmap.width < 1 || bitmap.height < 1 || bitmap.width * bitmap.height > 40000000) throw new Error("Photo dimensions are not supported.");
        const scale = Math.min(1, maxWidth / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", quality));
        if (!blob) throw new Error("Photo conversion failed.");
        return { blob, dataUrl: "" };
    } finally { bitmap.close?.(); if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl); }
};

// Small, verified WebP photo for Firestore-only installations (no Firebase Storage).
// Never use FileReader on the original file as the stored bytes.
window.viciPhotoToInlineData = async function(file, maxChars = 64000) {
    if (!Number.isInteger(maxChars) || maxChars < 12000 || maxChars > 70000) throw new Error('Invalid image size limit.');
    for (const [width, quality] of [[500,.54],[390,.45],[310,.38],[230,.31],[170,.24],[120,.18]]) {
        const { blob } = await window.compressImageFile(file,width,quality);
        const data = await new Promise((resolve,reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Unable to read optimized photo.'));
            reader.onload = () => resolve(String(reader.result || ''));
            reader.readAsDataURL(blob);
        });
        if (/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(data) && data.length <= maxChars) return data;
    }
    throw new Error('Image too detailed for the free-plan photo limit. Crop or choose another JPG, PNG, or WebP.');
};

window.uploadImageFileToStorage = async function(file, folderName, options = {}) {
    const { blob } = await window.compressImageFile(file, options.maxWidth || 800, options.quality ?? 0.6);
    try {
        const uniqueFileName = `${folderName}/${crypto.randomUUID()}.webp`;
        const storageRef = window.storage.ref().child(uniqueFileName);
        const snapshot = await storageRef.put(blob, {
            contentType: "image/webp", cacheControl: "public,max-age=31536000"
        });
        return await snapshot.ref.getDownloadURL();
    } catch (error) {
        throw new Error("Photo upload failed. Check Firebase Storage rules and your connection.");
    }
};



/* ============================================================
   SUKI CARD (loyalty stamp card) — shared module
   One renderer reused by: Business Hub studio preview, the
   place page, and the customer wallet. Card CSS lives in the
   "SUKI CARD" block of css/style.css.

   Flow (Owner-tap, locked design):
   Customer scans the establishment QR with Vicinify Scan
   (live camera only, rotating ~10s token, DEMO-GRADE; location
   verified within 200 m of the store) -> request appears in
   // the owner's Business Hub as "{customer} is requesting a stamp"
   // with [Approve] -> stamp lands on the customer card
   -> full card turns gold -> customer [Claim reward] -> owner
   marks claimed.

   The QR token rotates every ~10s and is validated by
   recomputing the time window in JS (demo-grade, not a server
   check) — see sukiMakeToken / sukiTokenValid.
   ============================================================ */
window.SukiDesign = (() => {
    const TEMPLATES = {
        forest: {label:"Forest",colorMode:"gradient",color:"#216d5b",gradId:"forest",gradFrom:"#1b5649",gradTo:"#328d74",pattern:"waves"},
        linen: {label:"Mint Linen",colorMode:"solid",color:"#edf5ef",gradId:"forest",gradFrom:"#edf5ef",gradTo:"#d8ebe0",pattern:"dots"},
        kraft:    { label: "Kraft",           colorMode: "solid",    color: "#a0714f", gradId: "sunset",   gradFrom: "#a0714f", gradTo: "#c49a6c", pattern: "beans" },
        minimal:  { label: "Minimal White",   colorMode: "solid",    color: "#f8fafc", gradId: "ocean",    gradFrom: "#ffffff", gradTo: "#e2e8f0", pattern: "dots" },
        midnight: { label: "Midnight",        colorMode: "gradient", color: "#0f172a", gradId: "midnight", gradFrom: "#0f172a", gradTo: "#475569", pattern: "lines" },
        pastel:   { label: "Sorbetes Pastel", colorMode: "gradient", color: "#f9a8d4", gradId: "custom",   gradFrom: "#fbcfe8", gradTo: "#bae6fd", pattern: "stars" },
        ginto:    { label: "Ginto",           colorMode: "gradient", color: "#0f172a", gradId: "ginto",    gradFrom: "#0f172a", gradTo: "#d4a017", pattern: "watermark" },
        custom:   { label: "Custom",          colorMode: "solid",    color: "#f59e0b", gradId: "sunset",   gradFrom: "#f97316", gradTo: "#ef4444", pattern: "none" }
    };
    const GRADIENTS = {
        forest: {label:"Forest",from:"#1b5649",to:"#328d74"},
        sunset:   { label: "Sunset",   from: "#f97316", to: "#ef4444" },
        ocean:    { label: "Ocean",    from: "#0ea5e9", to: "#2563eb" },
        matcha:   { label: "Matcha",   from: "#84cc16", to: "#16a34a" },
        berry:    { label: "Berry",    from: "#ec4899", to: "#8b5cf6" },
        ginto:    { label: "Ginto",    from: "#0f172a", to: "#d4a017" },
        midnight: { label: "Midnight", from: "#0f172a", to: "#475569" }
    };
    const PATTERNS = {
        none: "None", dots: "Dots", waves: "Waves", lines: "Lines",
        stars: "Stars", beans: "Beans", watermark: "Watermark"
    };
    // Lucide names. "" = auto (category default icon).
    const ICONS = ["", "star", "heart", "gift", "badge-check", "sparkles"];
    return { TEMPLATES, GRADIENTS, PATTERNS, ICONS };
})();

window.Suki = (() => {
    const D = window.SukiDesign;
    const TOKEN_WINDOW_MS = 60000; // Give phones more time to focus; still not a server-issued challenge.

    function sukiEsc(str) {
        if (str == null) return "";
        return String(str).replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[s]));
    }

    function catDefault(place) {
        const cat = String(place.category || place.cat || "default").toLowerCase();
        if (typeof window.vicinifyCatConfig === "function") {
            const c = window.vicinifyCatConfig(cat);
            if (c) return c;
        }
        return { color: "#f59e0b", icon: "star" };
    }

    // Normalized design object from a place doc. Owner override wins;
    // falls back to the establishment's category icon/color.
    function designOf(place) {
        const p = place || {};
        const cat = catDefault(p);
        const gradPreset = Object.hasOwn(D.GRADIENTS,p.suki_gradient) ? D.GRADIENTS[p.suki_gradient] : null;
        const hex = (value,fallback) => /^#[0-9a-f]{6}$/i.test(String(value||'')) ? String(value) : fallback;
        return {
            enabled: !!p.suki_enabled,
            stampCount: Math.max(2, Math.min(24, parseInt(p.suki_stamp_count, 10) || 8)),
            reward: String(p.suki_reward || "Free reward").slice(0, 120),
            icon: /^[a-z0-9-]{1,40}$/.test(String(p.suki_icon || cat.icon || 'star')) ? String(p.suki_icon || cat.icon || 'star') : 'star',
            template: String(p.suki_template || "custom"),
            colorMode: p.suki_color_mode === "gradient" ? "gradient" : "solid",
            color: hex(p.suki_color,'#237e72'),
            gradId: String(p.suki_gradient || "sunset"),
            gradFrom: hex(p.suki_gradient_from,(gradPreset && gradPreset.from)||'#1b5649'),
            gradTo: hex(p.suki_gradient_to,(gradPreset && gradPreset.to)||'#328d74'),
            pattern: Object.hasOwn(D.PATTERNS,p.suki_pattern) ? p.suki_pattern : 'none',
            placeName: String(p.name || "Establishment")
        };
    }

    // Pick white or near-black text by background lightness. Fixed
    // layout + this auto-switch keeps card text readable on any design.
    function textTone(hex) {
        let h = String(hex || "").replace("#", "").trim();
        if (/^[0-9a-fA-F]{3}$/.test(h)) h = h.split("").map(c => c + c).join("");
        if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#ffffff";
        const r = parseInt(h.slice(0, 2), 16) / 255;
        const g = parseInt(h.slice(2, 4), 16) / 255;
        const b = parseInt(h.slice(4, 6), 16) / 255;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return lum > 0.6 ? "#0f172a" : "#ffffff";
    }

    function customerDisplayName() {
        const user = window.auth?.currentUser;
        if (!user) return "Customer";
        return (typeof AppState !== "undefined" && AppState.userProfile?.fullName)
            || user.displayName || "Customer";
    }

    /* ---------- shared 3D card renderer ---------- */
    function renderCard(place, card, opts) {
        opts = opts || {};
        const d = designOf(place);
        const stamps = Math.min(d.stampCount,Math.max(0, parseInt(card && card.stamps, 10) || 0));
        const full = stamps >= d.stampCount;
        const baseForTone = d.colorMode === "gradient" ? d.gradFrom : d.color;
        const tone = textTone(baseForTone);
        const toneCls = tone === "#ffffff" ? "suki-on-dark" : "suki-on-light";
        const bg = d.colorMode === "gradient" ? `linear-gradient(135deg, ${d.gradFrom} 0%, ${d.gradTo} 100%)` : d.color;
        const cardId = (card && (card.cardId || card.id)) || "";
        const custName = (card && card.customerName) || "";
        const claimed = !!(card && card.claimed);
        const claimReq = !!(card && card.claimRequested);

        let slots = "";
        for (let i = 0; i < d.stampCount; i++) {
            slots += `<span class="suki-slot ${i < stamps ? "got" : ""}"><i data-lucide="${sukiEsc(d.icon)}"></i></span>`;
        }
        const remaining = Math.max(0,d.stampCount - stamps);
        const watermarkFront = d.pattern === "watermark"
            ? `<i data-lucide="${sukiEsc(d.icon)}" class="suki-watermark"></i>` : "";
        // The back face always carries the large faint watermark icon.
        const watermarkBack = `<i data-lucide="${sukiEsc(d.icon)}" class="suki-watermark"></i>`;
        const statusText = claimed ? "Claimed ✔"
            : claimReq ? "Claim pending — waiting for the owner"
            : full ? "Full! Claim it now 🎁" : "Not yet full";
        const claimBtn = (full && !claimed && !claimReq && !opts.hideActions)
            ? `<button type="button" class="suki-claim-btn" data-suki-claim="${sukiEsc(cardId)}"><i data-lucide="gift"></i> Claim reward</button>`
            : "";

        return `
        <div class="suki-3d${d.stampCount>12||d.reward.length>60||d.placeName.length>28?' suki-dense':''}" data-suki-card style="--suki-columns:${d.stampCount<=6?d.stampCount:d.stampCount<=8?4:d.stampCount<=10?5:d.stampCount<=18?6:8}" data-stamp-count="${d.stampCount}">
            <div class="suki-flip">
                <div class="suki-face suki-front ${toneCls}" style="background:${sukiEsc(bg)}; color:${tone};">
                    <div class="suki-pattern suki-pattern-${sukiEsc(d.pattern)}"></div>
                    ${watermarkFront}
                    <div class="suki-shine"></div>
                    <div class="suki-content">
                        <div class="suki-top">
                            <span class="suki-badge-icon"><i data-lucide="${sukiEsc(d.icon)}"></i></span>
                            <span class="suki-name" title="${sukiEsc(d.placeName)}">${sukiEsc(d.placeName)}</span>
                            ${full ? `<span class="suki-gold-tag">${claimed ? 'Claimed' : claimReq ? 'Claim pending' : 'Reward ready'}</span>` : ""}
                        </div>
                        <div class="suki-stamps">${slots}</div>
                        <div class="suki-progress"><b>${stamps} / ${d.stampCount}</b> stamps</div>
                        <div class="suki-reward"><span><i data-lucide="gift"></i></span><span title="${sukiEsc(d.reward)}">${sukiEsc(d.reward)}</span></div>
                        <div class="suki-remaining">${claimed ? "Reward claimed" : claimReq ? "Claim sent for review" : full ? "Your reward is ready" : `${remaining} more stamp${remaining === 1 ? "" : "s"} to go`}</div>
                    </div>
                    <button type="button" class="suki-flip-btn" data-suki-flip title="Flip" aria-label="Flip card"><i data-lucide="rotate-3d"></i></button>
                </div>
                <div class="suki-face suki-back ${toneCls}" style="background:${sukiEsc(bg)}; color:${tone};">
                    <div class="suki-pattern suki-pattern-${sukiEsc(d.pattern)}"></div>
                    ${watermarkBack}
                    <div class="suki-shine"></div>
                    <div class="suki-content suki-back-content">
                        <div class="suki-back-title">Suki Card</div>
                        <div class="suki-back-row"><span>Reward</span><b><i data-lucide="gift" style="width:14px;height:14px;vertical-align:-2px;"></i> ${sukiEsc(d.reward)}</b></div>
                        <div class="suki-back-row"><span>Card ID</span><b class="suki-mono">${sukiEsc(cardId || "—")}</b></div>
                        <div class="suki-back-row"><span>Cardholder</span><b>${sukiEsc(custName || "—")}</b></div>
                        <div class="suki-back-row"><span>Status</span><b>${sukiEsc(statusText)}</b></div>
                        ${claimBtn}
                    </div>
                    <button type="button" class="suki-flip-btn" data-suki-flip title="Back" aria-label="Flip card back"><i data-lucide="rotate-3d"></i></button>
                </div>
            </div>
            <div class="suki-shadow"></div>
        </div>`;
    }

    /* ---------- 3D interaction: pointer-drag rotate (clamped) + flip ---------- */
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function attachInteraction(root) {
        if (!root) return;
        // Cute hover feel: idle float is disabled for users who prefer reduced motion.
        const reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        root.querySelectorAll("[data-suki-card]").forEach(el => {
            if (el._sukiBound) return;
            el._sukiBound = true;
            const flip = el.querySelector(".suki-flip");
            const shadow = el.querySelector(".suki-shadow");
            if (!flip) return;
            const faceFront = flip.querySelector(".suki-face:not(.suki-back)");
            const faceBack = flip.querySelector(".suki-face.suki-back");
            flip.style.transition = "none"; // all motion is JS-driven now (rAF)
            let dragging = false, sx = 0, sy = 0;
            let baseTarget = 0, baseCur = 0;      // flip state: 0 = front, 180 = back
            let ry = 0, rx = 0;                  // current tilt (deg), clamped
            let vry = 0, vrx = 0;                // release momentum (deg/frame)
            let tRy = 0, tRx = 0;                // drag targets
            let relVry = 0, relVrx = 0;          // smoothed pointer velocity
            let lastTRy = 0, lastTRx = 0;
            let idlePhase = Math.random() * Math.PI * 2; // per-card phase offset
            let idleResumeAt = 0;
            let prevT = 0;
            const paint = (bobY, sway) => {
                const rotY = baseCur + ry + sway;
                flip.style.transform = "translateY(" + bobY.toFixed(2) + "px) rotateY(" + rotY.toFixed(2) + "deg) rotateX(" + rx.toFixed(2) + "deg)";
                // Explicit face visibility: bulletproof on browsers where
                // backface-visibility is ignored (mirrored-card bug).
                const norm = ((rotY % 360) + 360) % 360;
                const showBack = norm > 90 && norm < 270;
                if (faceFront) faceFront.style.visibility = showBack ? "hidden" : "visible";
                if (faceBack) faceBack.style.visibility = showBack ? "visible" : "hidden";
            };
            const tick = (now) => {
                if (!el.isConnected) return; // card was re-rendered away — stop this loop
                requestAnimationFrame(tick);
                const dt = Math.max(0.25, Math.min(3, (now - (prevT || now)) / 16.667));
                prevT = now;
                if (dragging) {
                    // eased chase of the pointer — smooth, no jitter
                    const k = 1 - Math.pow(0.60, dt);
                    ry += (tRy - ry) * k;
                    rx += (tRx - rx) * k;
                } else {
                    // momentum glide, then a gentle spring back to rest
                    ry += vry * dt; rx += vrx * dt;
                    const fr = Math.pow(0.90, dt);
                    vry *= fr; vrx *= fr;
                    const pull = 1 - Math.pow(0.94, dt);
                    ry += (0 - ry) * pull; rx += (0 - rx) * pull;
                    if (Math.abs(vry) < 0.02 && Math.abs(ry) < 0.05) { vry = 0; ry = 0; }
                    if (Math.abs(vrx) < 0.02 && Math.abs(rx) < 0.05) { vrx = 0; rx = 0; }
                }
                // smooth flip animation toward the target face
                const bk = 1 - Math.pow(0.78, dt);
                baseCur += (baseTarget - baseCur) * bk;
                if (Math.abs(baseTarget - baseCur) < 0.1) baseCur = baseTarget;
                // idle hover: soft bob + subtle sway + breathing shadow + drifting shine
                let bobY = 0, sway = 0, bobK = 0.5;
                const settled = !dragging && ry === 0 && rx === 0 && vry === 0 && vrx === 0;
                if (settled && !reducedMotion && now >= idleResumeAt) {
                    idlePhase += 0.022 * dt;
                    const s = Math.sin(idlePhase);
                    bobY = s * 5;
                    sway = 0;
                    bobK = (s + 1) / 2;
                    el.style.setProperty("--sx", (50 + Math.sin(idlePhase * 0.9) * 16).toFixed(1) + "%");
                    el.style.setProperty("--sy", (40 + Math.cos(idlePhase * 0.55) * 12).toFixed(1) + "%");
                }
                if (shadow) {
                    shadow.style.opacity = (0.30 + bobK * 0.22).toFixed(3);
                    shadow.style.transform = "translateX(-50%) scaleX(" + (1 - bobK * 0.14).toFixed(3) + ")";
                }
                paint(bobY, sway);
            };
            requestAnimationFrame(tick);
            el.addEventListener("pointerdown", e => {
                if (e.target.closest("[data-suki-flip],[data-suki-claim],button,a")) return;
                dragging = true; sx = e.clientX; sy = e.clientY;
                lastTRy = tRy = ry; lastTRx = tRx = rx; relVry = 0; relVrx = 0;
                flip.classList.add("suki-dragging");
                try { el.setPointerCapture(e.pointerId); } catch (_) {}
            });
            el.addEventListener("pointermove", e => {
                if (!dragging) return;
                tRy = clamp((e.clientX - sx) / 6, -40, 40);
                tRx = clamp(-(e.clientY - sy) / 6, -25, 25);
                relVry = relVry * 0.65 + (tRy - lastTRy) * 0.35;
                relVrx = relVrx * 0.65 + (tRx - lastTRx) * 0.35;
                lastTRy = tRy; lastTRx = tRx;
                const r = el.getBoundingClientRect();
                el.style.setProperty("--sx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
                el.style.setProperty("--sy", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
            });
            const end = () => {
                if (!dragging) return;
                dragging = false;
                // no fling: stop dead and ease cleanly back to rest
                vry = 0; vrx = 0;
                flip.classList.remove("suki-dragging");
                idleResumeAt = performance.now() + 900; // settle first, then hover resumes
            };
            el.addEventListener("pointerup", end);
            el.addEventListener("pointercancel", end);
            el.querySelectorAll("[data-suki-flip]").forEach(b => {
                b.addEventListener("click", ev => {
                    ev.stopPropagation();
                    el.classList.toggle("is-flipped");
                    baseTarget = el.classList.contains("is-flipped") ? 180 : 0;
                });
            });
        });
        root.querySelectorAll("[data-suki-claim]").forEach(btn => {
            if (btn._sukiBound) return;
            btn._sukiBound = true;
            btn.addEventListener("click", () => requestClaim(btn.getAttribute("data-suki-claim")));
        });
        root.querySelectorAll("[data-suki-cancel-req]").forEach(btn => {
            if (btn._sukiBound) return;
            btn._sukiBound = true;
            btn.addEventListener("click", () => cancelRequest(btn.getAttribute("data-suki-cancel-req")));
        });
        window.debouncedIcons?.();
    }

    /* ---------- rotating QR token (demo-grade) ---------- */
    function tokenWindow(nowMs) { return Math.floor((nowMs ?? Date.now()) / TOKEN_WINDOW_MS); }
    // Token format: VICINIFY-SUKI|<placeId>|<windowId>
    function makeToken(placeId, nowMs) { return `VICINIFY-SUKI|${placeId}|${tokenWindow(nowMs)}`; }
    function parseToken(str) {
        const m = /^VICINIFY-SUKI\|([^|]+)\|(\d+)$/.exec(String(str || "").trim());
        if (!m) return null;
        return { placeId: m[1], windowId: parseInt(m[2], 10) };
    }
    // DEMO-GRADE validation: permit up to one QR window of clock skew
    // in either direction. NOT a signed token or server-side check.
    function tokenValid(parsed, nowMs) {
        if (!parsed || !parsed.placeId || !Number.isFinite(parsed.windowId)) return false;
        const cur = tokenWindow(nowMs);
        return Math.abs(parsed.windowId - cur) <= 1;
    }

    const sukiLibraryLoads = new Map();
    function loadScriptOnce(src) {
        if(src.includes('qrcode')&&window.QRCode || src.includes('jsQR')&&window.jsQR)return Promise.resolve();
        if(sukiLibraryLoads.has(src))return sukiLibraryLoads.get(src);
        const promise=new Promise((resolve,reject)=>{
            const script=document.createElement('script');script.src=src;script.async=true;script.dataset.sukiLib=src;
            script.onload=()=>resolve();script.onerror=()=>{script.remove();sukiLibraryLoads.delete(src);reject(new Error('Failed to load scanner library.'));};
            document.head.append(script);
        });sukiLibraryLoads.set(src,promise);return promise;
    }
    const QR_LIB = "/js/vendor/qrcode.min.js";
    const JSQR_LIB = "/js/vendor/jsQR.js";

    // Owner-side: rotating QR display. The timer is module-level, not
    // element-tracked: mountPlaceSection replaces the [data-suki-qr]
    // element via innerHTML on every visit, which orphaned the timer
    // on the destroyed element — one leaked 1s interval per visit,
    // the reported establishment-page lag. (v53 lag fix)
    let activeSukiScannerClose = null;
    let ownerQrTimer = null;
    let ownerQrGen = 0;
    async function renderOwnerQr(el, placeId) {
        if (!el || !placeId) return;
        const gen = ++ownerQrGen;
        if (ownerQrTimer) { clearInterval(ownerQrTimer); ownerQrTimer = null; }
        el.innerHTML = `<div class="suki-qr-box">
            <div class="suki-qr-img"><div class="muted" style="padding:30px;">Loading QR…</div></div>
            <div class="suki-qr-token"></div>
            <div class="suki-qr-count muted" style="font-size:12px; margin-top:4px;"></div>
        </div>`;
        try { await loadScriptOnce(QR_LIB); }
        catch (e) {
            el.querySelector(".suki-qr-img").innerHTML = `<div class="muted" style="padding:20px; font-size:13px;">Could not load the QR library.<br>Token: <b>${sukiEsc(makeToken(placeId))}</b></div>`;
            return;
        }
        const box = el.querySelector(".suki-qr-img");
        const paint = () => {
            box.innerHTML = "";
            const token = makeToken(placeId);
            try { new window.QRCode(box, { text: token, width: 224, height: 224, colorDark: "#000000", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.M }); }
            catch (e) { box.textContent = token; }
            el.querySelector(".suki-qr-token").textContent = token;
        };
        let lastWindow = tokenWindow();
        const tick = () => {
            const w = tokenWindow();
            if (w !== lastWindow) { lastWindow = w; paint(); }
            const remaining = Math.ceil((TOKEN_WINDOW_MS - (Date.now() % TOKEN_WINDOW_MS)) / 1000);
            const countEl = el.querySelector(".suki-qr-count");
            if (countEl) countEl.textContent = `QR refreshes every 60s · ${remaining}s left`;
        };
        if (gen !== ownerQrGen) return; // superseded: a newer mount/unmount won the race
        paint();
        ownerQrTimer = setInterval(tick, 1000);
        tick();
    }

    /* ---------- place-page unmount: stop the rotating QR timer ----------
       WHY this exists: the owner-view QR was rendered into a div via innerHTML
       on every place-page visit, and the 1s refresh interval was stored on that
       div (el._sukiQrTimer). When innerHTML destroyed the div, the interval
       survived as an orphan — one leaked timer per visit, each repainting a
       full QRCode into detached DOM every 10s. The timer is now module-scoped
       with a generation counter: re-mounting increments the generation so stale
       async mounts abort, and unmounting clears the interval outright. */
    let sukiPlaceMountGeneration = 0;
    let sukiPlaceLiveStops = [];
    function stopSukiPlaceLive() {
        sukiPlaceLiveStops.forEach(stop => { try { stop(); } catch (_) {} });
        sukiPlaceLiveStops = [];
        window.SukiPlaceMarkPending = null;
        window.SukiPlaceSubmissionState = null;
    }
    function unmountPlaceSection() {
        stopSukiPlaceLive();
        sukiPlaceMountGeneration++; // invalidate any pending Firestore reads for the old establishment
        activeSukiScannerClose?.();
        ownerQrGen++;
        if (ownerQrTimer) { clearInterval(ownerQrTimer); ownerQrTimer = null; }
        if (window.SukiPlaceRefresh) window.SukiPlaceRefresh = null;
    }

    /* ---------- stamp request / claim flows ---------- */
    async function pendingSukiRequest(placeId, customerUid) {
        try {
            return await window.db.collection('stamp_requests')
                .where('placeId', '==', placeId)
                .where('customerUid', '==', customerUid)
                .where('status', '==', 'pending')
                .limit(1).get();
        } catch (error) {
            if (error?.code !== 'failed-precondition') throw error;
            // Older deployments sometimes lack the three-field composite
            // index. Query only the authenticated customer (a built-in
            // single-field index), then filter locally until the provided
            // firestore.indexes.json has been deployed. No cross-user read.
            console.warn('[suki] stamp_requests composite index missing; using customer-scoped fallback.');
            const scoped = await window.db.collection('stamp_requests')
                .where('customerUid', '==', customerUid).get();
            const docs = scoped.docs.filter(doc => {
                const data = doc.data();
                return data.placeId === placeId && data.customerUid === customerUid && data.status === 'pending';
            }).slice(0, 1);
            return { empty: docs.length === 0, docs };
        }
    }
    // A successful QR scan may reuse a recently verified GPS fix for at most
    // eight seconds. This removes the second slow iOS GPS lookup on a quick
    // scan, without accepting expired/failed geolocation checks. Direct
    // requestStamp calls still perform their own fresh location verification.
    let recentScanProof = null;
    let stampSubmitBusy = false;
    async function requestStamp(place) {
        if (stampSubmitBusy) return;
        const user = window.auth?.currentUser;
        if (!user) { if (typeof showPage === "function") showPage("page-login"); return; }
        if (!place || !place.id) return;
        if (place.owner_uid && place.owner_uid === user.uid) {
            window.showToast?.("This is your own store — you can't request a stamp from yourself.", "error");
            return;
        }
        if (user.emailVerified === false) { window.showToast?.('Verify your email before requesting a stamp.', 'error'); return; }
        // Always verify here as well; direct calls to Suki.requestStamp must
        // never skip the location gate. A browser GPS value is not tamper-proof.
        const proof = recentScanProof;
        recentScanProof = null; // consume immediately; never retain an unlock
        const pin = scanPlaceCoords(place);
        const useProof = !!(proof && proof.placeId === place.id &&
            proof.userUid === user.uid && proof.checkedAt <= Date.now() &&
            Date.now() - proof.checkedAt <= 8000 && pin &&
            proof.lat === pin.lat && proof.lng === pin.lng && proof.proximity?.ok);
        const proximity = useProof ? proof.proximity : await verifyScanLocation(place);
        if (!proximity.ok) { window.showToast?.(proximity.msg || 'You must be near the establishment to scan.', 'error'); return; }
        stampSubmitBusy = true;
        window.SukiPlaceSubmissionState?.('sending');
        try {
            const dup = await pendingSukiRequest(place.id, user.uid);
            if (!dup.empty) {
                window.showToast?.("You already have a pending stamp request — waiting for the owner's approval.", "info");
                return;
            }
            const requestDoc = await window.db.collection("stamp_requests").add({
                placeId: place.id,
                placeName: place.name || "",
                owner_uid: place.owner_uid || "",
                customerUid: user.uid,
                customerName: customerDisplayName(),
                status: "pending",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            // Owner approval creates the card atomically (if needed). Writing a
            // zero-stamp card *after* request submission can race an approval
            // and reset a newly awarded stamp to zero. Do not do that here.
            window.SukiPlaceMarkPending?.({ id: requestDoc?.id || '', status: 'pending', placeId: place.id });
            window.showToast?.("Stamp request sent! Please wait for the owner's approval.", "success");
        } catch (err) {
            if (err?.code === 'failed-precondition') {
                window.showToast?.('Suki request could not be checked. The Firestore stamp_requests index may still need deployment.', 'error');
            } else if (err?.code === 'permission-denied') {
                window.showToast?.('Stamp request denied. Check that your account email is verified and that this store is enabled.', 'error');
            } else window.handleFirestoreError?.(err, 'Could not send the stamp request.');
        } finally {
            stampSubmitBusy = false;
            window.SukiPlaceSubmissionState?.('idle');
        }
    }

    async function cancelRequest(requestId) {
        if (!requestId) return;
        const ans = await window.vConfirm("Cancel request", "Cancel this stamp request?", "Cancel", true);
        if (!ans) return;
        try {
            await window.db.collection("stamp_requests").doc(requestId).update({ status: "cancelled" });
            window.showToast?.("Stamp request cancelled.", "info");
        } catch (err) { window.handleFirestoreError(err, "Could not cancel the request."); }
        if (typeof window.SukiPlaceRefresh === "function") window.SukiPlaceRefresh();
    }

    async function requestClaim(cardId) {
        if (!cardId) return;
        const ans = await window.vConfirm("Claim reward", "Claim the reward? Show it to the owner to mark it as claimed.", "Claim", false);
        if (!ans) return;
        try {
            await window.db.collection("loyalty_cards").doc(cardId).update({
                claimRequested: true,
                claimRequestedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            window.showToast?.("Claim request sent! Show the card to the owner.", "success");
        } catch (err) { window.handleFirestoreError(err, "Could not send the claim request."); }
        if (typeof window.SukiPlaceRefresh === "function") window.SukiPlaceRefresh();
    }

    // Owner: approve inside a transaction — request -> approved and the
    // customer's card gains exactly one stamp (deterministic card ID
    // keeps a double-tap from double-stamping).
    async function approveRequest(requestId) {
        if (!requestId) return;
        try {
            await window.db.runTransaction(async t => {
                const reqRef = window.db.collection("stamp_requests").doc(requestId);
                const reqSnap = await t.get(reqRef);
                if (!reqSnap.exists) throw new Error("Request not found.");
                const r = reqSnap.data();
                if (r.status !== "pending") throw new Error("This request has already been handled.");
                const cardId = `${r.placeId}_${r.customerUid}`;
                const cardRef = window.db.collection("loyalty_cards").doc(cardId);
                const cardSnap = await t.get(cardRef);
                t.update(reqRef, {
                    status: "approved",
                    approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                if (cardSnap.exists) {
                    t.update(cardRef, {
                        stamps: (parseInt(cardSnap.data().stamps, 10) || 0) + 1,
                        customerName: r.customerName || cardSnap.data().customerName || "Customer",
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    t.set(cardRef, {
                        placeId: r.placeId,
                        customerUid: r.customerUid,
                        customerName: r.customerName || "Customer",
                        stamps: 1,
                        claimed: false,
                        claimRequested: false,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });
            window.showToast?.("Stamp approved! 🎉", "success");
        } catch (err) { window.handleFirestoreError(err, "Could not approve the request."); }
    }

    async function rejectRequest(requestId) {
        if (!requestId) return;
        try {
            await window.db.collection("stamp_requests").doc(requestId).update({
                status: "rejected",
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            window.showToast?.("Stamp request rejected.", "info");
        } catch (err) { window.handleFirestoreError(err, "Could not reject the request."); }
    }

    async function markClaimed(cardId) {
        if (!cardId) return;
        const ans = await window.vConfirm("Mark as claimed", "Has the reward been given to the customer?", "Given", false);
        if (!ans) return;
        try {
            await window.db.collection("loyalty_cards").doc(cardId).update({
                claimed: true,
                claimRequested: false,
                claimedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            window.showToast?.("Marked as claimed. 🎁", "success");
        } catch (err) { window.handleFirestoreError(err, "Could not mark the claim."); }
    }

    /* ---------- Vicinify Scan: live-camera QR + strict proximity verification ---------- */
    // A browser cannot prove a GPS reading has not been spoofed. This gate
    // rejects distant/unknown locations in the normal UI; the owner still
    // must approve each stamp. Do not treat it as server-enforced geofencing.
    const SUKI_SCAN_RADIUS_M = 150;
    const SUKI_MAX_GPS_ACCURACY_M = 100;

    function haversineM(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const rad = d => d * Math.PI / 180;
        const dLat = rad(lat2 - lat1), dLng = rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.min(1, Math.sqrt(Math.max(0, a))));
    }

    function scanPlaceCoords(place) {
        // No fallback to a map viewport, customer GPS, or (0,0): only the
        // actual saved establishment pin qualifies for a stamp.
        const lat = Number(place?.lat), lng = Number(place?.lng);
        if (place?.lat == null || place?.lng == null ||
            String(place.lat).trim() === '' || String(place.lng).trim() === '' ||
            !Number.isFinite(lat) || !Number.isFinite(lng) ||
            Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null;
        return { lat, lng };
    }

    function checkScanDistance(place, position) {
        const pin = scanPlaceCoords(place);
        if (!pin) return { ok: false, reason: 'missing-pin', msg: "This store has no valid map pin. Ask the business owner to correct the establishment's location before scanning." };
        const coords = position?.coords;
        const lat = Number(coords?.latitude), lng = Number(coords?.longitude);
        const accuracy = Number(coords?.accuracy);
        if (!coords || !Number.isFinite(lat) || !Number.isFinite(lng) ||
            Math.abs(lat) > 90 || Math.abs(lng) > 180 || !Number.isFinite(accuracy) || accuracy < 0) {
            return { ok: false, reason: 'gps-unavailable', msg: 'Could not verify your current location. Turn on precise location and try again.' };
        }
        if (accuracy > SUKI_MAX_GPS_ACCURACY_M) {
            return { ok: false, reason: 'gps-inaccurate', accuracy, msg: `Your GPS is only accurate to about ${Math.round(accuracy)} m. Enable Precise Location or move to an open area, then retry.` };
        }
        const distance = haversineM(lat, lng, pin.lat, pin.lng);
        // Account for GPS uncertainty so someone apparently beyond the
        // radius is not accepted just because the device reports a wide fix.
        if (distance + accuracy > SUKI_SCAN_RADIUS_M) {
            return { ok: false, reason: 'too-far', distance, accuracy, msg: `You must be within ${SUKI_SCAN_RADIUS_M} m of this store to scan. Your reported distance is about ${Math.round(distance)} m (±${Math.round(accuracy)} m).` };
        }
        return { ok: true, distance, accuracy };
    }

    // Always get a fresh, accurate position. Missing pin, denied permissions,
    // expired fixes, and browser geolocation errors must NOT bypass scanning.
    function verifyScanLocation(place) {
        const pin = scanPlaceCoords(place);
        if (!pin) return Promise.resolve(checkScanDistance(place));
        if (!navigator.geolocation?.getCurrentPosition) {
            return Promise.resolve({ ok: false, reason: 'gps-unavailable', msg: 'Location services are unavailable. Use a phone with GPS and enable location permission to scan.' });
        }
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                position => resolve({ ...checkScanDistance(place, position), verifiedAt: Date.now() }),
                error => {
                    const denied = error?.code === 1;
                    const timedOut = error?.code === 3;
                    resolve({ ok: false, reason: denied ? 'gps-denied' : 'gps-unavailable', msg: denied
                        ? 'Location permission is blocked. Allow Precise Location for Vicinify in your browser settings and try again.'
                        : timedOut ? 'Getting your GPS location took too long. Turn on Location and try again outside or near a window.'
                            : 'Could not get your GPS location. Enable location services and try again.' });
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });
    }

    function scannerErrorMessage(error) {
        if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') return 'Camera permission was denied. Allow camera access for this website in your browser settings.';
        if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') return 'No camera was found. Open Vicinify on a phone with a camera.';
        if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') return 'Camera is in use by another app. Close the other app and try again.';
        if (error?.name === 'OverconstrainedError') return 'Could not start the rear camera. Try again with the device camera enabled.';
        return 'Could not start the camera. Check browser camera permissions and try again.';
    }

    async function openScanner(expectedPlace) {
        activeSukiScannerClose?.();
        if (!window.auth?.currentUser) { window.showToast?.('Log in to scan a Suki Card.', 'error'); return; }
        if (window.auth.currentUser.emailVerified === false) { window.showToast?.('Verify your email address before requesting a stamp.', 'error'); return; }
        if (!navigator.mediaDevices?.getUserMedia) { window.showToast?.('Camera scanning requires HTTPS and a supported browser. Try Chrome or Safari on your phone.', 'error'); return; }
        if (!window.isSecureContext && window.location?.hostname !== 'localhost') { window.showToast?.('Camera and GPS permissions require a secure HTTPS website.', 'error'); return; }

        const overlay = document.createElement('div');
        overlay.className = 'suki-scan-overlay';
        overlay.setAttribute('role','dialog');
        overlay.setAttribute('aria-label','Vicinify Suki QR scanner');
        overlay.innerHTML = `
            <div class="suki-scan-box">
                <div class="suki-scan-title">
                    <b>Vicinify Scan</b>
                    <button type="button" class="suki-scan-close">Close</button>
                </div>
                <div class="suki-scan-camera"><video playsinline muted autoplay></video><canvas hidden></canvas></div>
                <div class="suki-scan-hint" role="status" aria-live="polite">Checking that you're within ${SUKI_SCAN_RADIUS_M} m of this establishment…</div>
            </div>`;
        document.body.appendChild(overlay);
        const hint = overlay.querySelector('.suki-scan-hint');
        const video = overlay.querySelector('video');
        const canvas = overlay.querySelector('canvas');
        let done = false, stream = null, raf = 0, decodeBusy = false, lastDecode = 0;
        let geoWatchId = null, latestGeo = null;
        const close = () => {
            if (done) return;
            done = true;
            cancelAnimationFrame(raf);
            if (geoWatchId !== null) {
                try { navigator.geolocation?.clearWatch?.(geoWatchId); } catch (_) {}
                geoWatchId = null;
            }
            if (stream) stream.getTracks().forEach(t => t.stop());
            video.srcObject = null;
            overlay.remove();
            if (activeSukiScannerClose === close) activeSukiScannerClose = null;
        };
        activeSukiScannerClose = close;
        overlay.querySelector('.suki-scan-close').onclick = close;

        try {
            // Verify before ever opening the camera; use the current saved
            // Firebase place coordinates rather than potentially stale UI data.
            if (!expectedPlace?.id) throw new Error('Store not identified. Open the establishment and try again.');
            const storeSnap = await window.db.collection('places').doc(expectedPlace.id).get();
            if (done) return;
            if (!storeSnap.exists) throw new Error('This store was not found.');
            const store = { ...storeSnap.data(), id: storeSnap.id };
            if (!store.suki_enabled) throw new Error('This store does not currently offer Suki Card stamps.');
            const near = await verifyScanLocation(store);
            if (done) return;
            if (!near.ok) throw new Error(near.msg);
            latestGeo = near;
            hint.textContent = `Location verified. You are about ${Math.round(near.distance)} m away. Point your camera at the store's current Suki QR.`;
            // Keep the GPS fix fresh while the QR camera is running. On most
            // phones this avoids a blocking second GPS lookup even if the
            // customer needs several seconds to focus on the QR.
            if (typeof navigator.geolocation?.watchPosition === 'function') {
                try {
                    geoWatchId = navigator.geolocation.watchPosition(position => {
                        if (done) return;
                        latestGeo = { ...checkScanDistance(store, position), verifiedAt: Date.now() };
                        if (!latestGeo.ok) hint.textContent = latestGeo.msg;
                    }, () => {}, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
                } catch (_) { geoWatchId = null; }
            }
            await loadScriptOnce(JSQR_LIB);
            if (done) return;
            if (typeof window.jsQR !== 'function') throw new Error('Scanner library unavailable. Please refresh Vicinify and retry.');
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
            } catch (cameraError) {
                // Some browsers reject ideal video constraints. Try a simpler
                // request, and retain a useful error if permissions are denied.
                if (cameraError?.name === 'OverconstrainedError') {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                } else throw new Error(scannerErrorMessage(cameraError));
            }
            if (done) { stream.getTracks().forEach(t => t.stop()); return; }
            video.srcObject = stream;
            await video.play();
            if (done) return;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) throw new Error('This browser could not initialize the camera scanner.');

            // Use native QR detection on supported devices, with bundled
            // jsQR as a cross-browser fallback. No photo uploads or manual
            // entry are permitted for customer stamp requests.
            let nativeDetector = null;
            if (typeof window.BarcodeDetector === 'function') {
                try { nativeDetector = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (_) {}
            }
            const decode = async () => {
                if (done || decodeBusy) return;
                const now = performance.now();
                if (now - lastDecode < 130) return;
                if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;
                lastDecode = now;
                decodeBusy = true;
                try {
                    let content = null;
                    if (nativeDetector) {
                        try {
                            const codes = await nativeDetector.detect(video);
                            content = codes?.find(q => q?.rawValue)?.rawValue || null;
                        } catch (_) { nativeDetector = null; }
                    }
                    if (!content && !done) {
                        const scale = Math.min(1, 960 / video.videoWidth);
                        const width = Math.max(1, Math.round(video.videoWidth * scale));
                        const height = Math.max(1, Math.round(video.videoHeight * scale));
                        if (canvas.width !== width) canvas.width = width;
                        if (canvas.height !== height) canvas.height = height;
                        ctx.drawImage(video, 0, 0, width, height);
                        const result = window.jsQR(ctx.getImageData(0, 0, width, height).data, width, height, { inversionAttempts: 'attemptBoth' });
                        content = result?.data || null;
                    }
                    if (done || !content) return;
                    const parsed = parseToken(String(content).trim());
                    if (!parsed) { hint.textContent = 'This is not a Vicinify Suki QR. Scan the QR shown by the establishment.'; return; }
                    if (parsed.placeId !== store.id) { hint.textContent = 'This QR belongs to a different establishment.'; return; }
                    if (!tokenValid(parsed)) { hint.textContent = 'This QR expired. Ask the store to display its current QR and try again.'; return; }
                    if (!latestGeo?.ok) { hint.textContent = latestGeo?.msg || 'Your location could not be verified. Try again.'; return; }
                    const finalGeo = latestGeo;
                    close();
                    const pin = scanPlaceCoords(store);
                    recentScanProof = pin ? { placeId: store.id, userUid: window.auth?.currentUser?.uid,
                        checkedAt: finalGeo.verifiedAt || 0, proximity: finalGeo, lat: pin.lat, lng: pin.lng } : null;
                    // The current store was just verified from Firebase.
                    // Do not fetch it again on the successful QR path.
                    await requestStamp(store);
                } catch (error) {
                    if (!done) { console.warn('[suki] scanner decode:', error); hint.textContent = 'Could not read QR. Hold the camera steady in good lighting and try again.'; }
                } finally { decodeBusy = false; }
            };
            const loop = () => { if (done) return; raf = requestAnimationFrame(loop); void decode(); };
            loop();
        } catch (error) {
            const message = error?.message || scannerErrorMessage(error);
            close();
            window.showToast?.(message, 'error');
            console.warn('[suki] scanner:', message);
        }
    }

    async function requestStampForPlaceId(placeId) {
        if (!placeId) return;
        try {
            const snap = await window.db.collection('places').doc(placeId).get();
            if (!snap.exists) { window.showToast?.('Store not found.', 'error'); return; }
            const place = { ...snap.data(), id: snap.id };
            if (!place.suki_enabled) { window.showToast?.('This store has no active Suki Card.', 'error'); return; }
            await requestStamp(place);
        } catch (error) { window.handleFirestoreError?.(error, 'Could not verify this Suki stamp.'); }
    }

    /* ---------- place-page mount ---------- */
    async function mountPlaceSection(place, isOwner) {
        const el = document.getElementById("placeSukiSection");
        if (!el || !place?.id) return;
        // The public map intentionally caches places for five minutes. A saved
        // Suki configuration must NOT depend on that cached copy: always read
        // the current establishment document before deciding whether to show it.
        stopSukiPlaceLive();
        const generation = ++sukiPlaceMountGeneration;
        const stillHere = () => generation === sukiPlaceMountGeneration &&
            document.getElementById('placeSukiSection') === el;
        el.innerHTML = '<div class="suki-place-block"><p class="suki-note" role="status">Checking Suki Card availability…</p></div>';
        let livePlace;
        try {
            const snap = await window.db.collection('places').doc(place.id).get();
            if (!stillHere()) return;
            if (!snap.exists) throw new Error('This establishment could not be found.');
            livePlace = { ...snap.data(), id: snap.id };
        } catch (error) {
            if (!stillHere()) return;
            console.warn('[suki] could not load fresh establishment details:', error);
            el.innerHTML = `<div class="suki-place-block">
                <div class="suki-place-head"><i data-lucide="stamp"></i><h3>Suki Card</h3></div>
                <p class="suki-note" role="alert">Couldn't verify this establishment's current Suki Card status. Check your connection and try again.</p>
                <button type="button" class="suki-req-btn" data-suki-retry>Retry</button>
            </div>`;
            el.querySelector('[data-suki-retry]')?.addEventListener('click', () => mountPlaceSection(place, isOwner));
            window.debouncedIcons?.();
            return;
        }
        if (!designOf(livePlace).enabled) {
            // Keep the mount point in the DOM: removing the div made a
            // subsequently enabled Suki Card impossible to mount in this view.
            if (isOwner) {
                el.innerHTML = `<div class="suki-place-block">
                    <div class="suki-place-head"><i data-lucide="stamp"></i><h3>Suki Card is off</h3></div>
                    <p class="suki-note">Enable and save your card in Suki Card Studio to show it to customers.</p>
                    <button type="button" class="suki-req-btn" data-suki-edit>Edit Suki Card</button>
                </div>`;
                el.querySelector('[data-suki-edit]')?.addEventListener('click', () => window.DashboardPage?.openSukiStudio?.(livePlace.id));
                window.debouncedIcons?.();
            } else el.replaceChildren();
            return;
        }

        const user = window.auth?.currentUser;
        // Store owners need to see the actual public-facing card design, not
        // just the QR. The preview is *not* a real customer's loyalty card.
        if (isOwner) {
            el.innerHTML = `
                <div class="suki-place-block">
                    <div class="suki-place-head"><i data-lucide="stamp"></i><h3>Store Suki Card</h3></div>
                    <p class="suki-note">This is the card design your customers will see.</p>
                    <div class="suki-place-preview">${renderCard(livePlace, { stamps: 0, customerName: 'Preview' }, { hideActions: true })}</div>
                    <div class="suki-place-actions"><button type="button" class="suki-req-btn" data-suki-edit><i data-lucide="pencil"></i> Edit Suki Card</button></div>
                    <div class="suki-place-head" style="margin-top:22px"><i data-lucide="qr-code"></i><h3>Store Suki QR</h3></div>
                    <p class="suki-note">Customers must be near your saved map pin (within 150 m, allowing for GPS accuracy) to scan. You approve or reject each request.</p>
                    <div data-suki-qr></div>
                </div>`;
            attachInteraction(el);
            el.querySelector('[data-suki-edit]')?.addEventListener('click', () => window.DashboardPage?.openSukiStudio?.(livePlace.id));
            renderOwnerQr(el.querySelector('[data-suki-qr]'), livePlace.id);
            return;
        }

        if (!user) {
            el.innerHTML = `
                <div class="suki-place-block">
                    <div class="suki-place-head"><i data-lucide="stamp"></i><h3>Suki Card</h3></div>
                    <p class="suki-note">This establishment offers Suki Card rewards. Sign in to see your stamps.</p>
                    <div class="suki-place-preview">${renderCard(livePlace, { stamps: 0, customerName: 'Preview' }, { hideActions: true })}</div>
                    <div class="suki-place-actions"><button type="button" class="suki-req-btn" data-suki-login><i data-lucide="log-in"></i> Log in to collect stamps</button></div>
                </div>`;
            attachInteraction(el);
            el.querySelector('[data-suki-login]')?.addEventListener('click', () => showPage('page-login'));
            return;
        }

        el.innerHTML = '<div class="suki-place-block"><p class="suki-note" role="status">Loading your Suki Card…</p></div>';
        const cardId = `${livePlace.id}_${user.uid}`;
        // A missing index or an unavailable stamp_requests query must not
        // hide the entire card. Show the card but disable new scan requests
        // until the pending-request status can be verified.
        const [cardResult, requestResult] = await Promise.allSettled([
            window.db.collection('loyalty_cards').doc(cardId).get(),
            pendingSukiRequest(livePlace.id, user.uid)
        ]);
        if (!stillHere()) return;
        const cardError = cardResult.status === 'rejected';
        const reqError = requestResult.status === 'rejected';
        if (cardError) console.warn('[suki] could not load customer card:', cardResult.reason);
        if (reqError) console.warn('[suki] could not load pending stamp request:', requestResult.reason);
        if (cardError) {
            el.innerHTML = `<div class="suki-place-block">
                <div class="suki-place-head"><i data-lucide="stamp"></i><h3>Suki Card</h3></div>
                <p class="suki-note" role="alert">Your stamps could not be loaded. No changes were made. Please retry.</p>
                <div class="suki-place-actions"><button type="button" class="suki-req-btn" data-suki-retry>Retry</button></div>
            </div>`;
            el.querySelector('[data-suki-retry]')?.addEventListener('click', () => mountPlaceSection(livePlace, isOwner));
            window.debouncedIcons?.();
            return;
        }
        const cardSnap = cardResult.value;
        const card = cardSnap.exists
            ? { cardId, id: cardSnap.id, ...cardSnap.data() }
            : { cardId, stamps: 0, claimed: false, claimRequested: false, customerName: customerDisplayName() };
        const reqSnap = reqError ? null : requestResult.value;
        const pendingReq = reqSnap && !reqSnap.empty ? { id: reqSnap.docs[0].id, ...reqSnap.docs[0].data() } : null;
        el.innerHTML = `
            <div class="suki-place-block">
                <div class="suki-place-head"><i data-lucide="stamp"></i><h3>Suki Card</h3></div>
                <div class="suki-place-preview">${renderCard(livePlace, card)}</div>
                <p class="suki-note">Scanning requires camera, Precise Location, and being within 150 m of the store's saved map pin. Stamps still require store approval.</p>
                <div class="suki-place-actions">
                    ${reqError ? `
                        <p class="suki-note" role="alert">Could not check pending requests. Scan is temporarily unavailable to prevent duplicate requests.</p>
                        <button type="button" class="suki-req-btn" data-suki-retry>Retry request status</button>
                    ` : pendingReq ? `
                        <button type="button" class="suki-req-btn suki-req-wait" disabled><i data-lucide="clock"></i> Stamp request pending</button>
                        <button type="button" class="suki-plain-btn" data-suki-cancel-req="${sukiEsc(pendingReq.id)}">Cancel request</button>
                    ` : `
                        <button type="button" class="suki-req-btn" data-suki-scan><i data-lucide="qr-code"></i> Scan store QR</button>
                    `}
                </div>
            </div>`;
        attachInteraction(el);
        el.querySelector('[data-suki-scan]')?.addEventListener('click', () => openScanner(livePlace));
        el.querySelector('[data-suki-retry]')?.addEventListener('click', () => mountPlaceSection(livePlace, isOwner));
        // Keep the mounted card alive while the owner approves. onSnapshot
        // pushes approved stamps without a reload and avoids repeated reads of
        // the entire establishment and its GPS/QR panel.
        const previewEl = el.querySelector('.suki-place-preview');
        const actionsEl = el.querySelector('.suki-place-actions');
        const uid = user.uid;
        let latestPending = pendingReq;
        let requestError = reqError;
        let submitting = false;
        let lastCardVersion = JSON.stringify([card.stamps, card.claimed, card.claimRequested, card.customerName]);
        const stillWatching = () => stillHere() && window.auth?.currentUser?.uid === uid;
        const displayRequestActions = () => {
            if (!stillWatching() || !actionsEl) return;
            actionsEl.innerHTML = requestError ? `
                <p class="suki-note" role="alert">Could not check pending requests. Scan is temporarily unavailable to prevent duplicates.</p>
                <button type="button" class="suki-req-btn" data-suki-retry>Retry request status</button>`
                : latestPending ? `
                <button type="button" class="suki-req-btn suki-req-wait" disabled><i data-lucide="clock"></i> Stamp request pending</button>
                ${latestPending.id ? `<button type="button" class="suki-plain-btn" data-suki-cancel-req="${sukiEsc(latestPending.id)}">Cancel request</button>` : ''}`
                : submitting ? `<button type="button" class="suki-req-btn suki-req-wait" disabled><i data-lucide="loader-circle"></i> Sending request…</button>`
                : `<button type="button" class="suki-req-btn" data-suki-scan><i data-lucide="qr-code"></i> Scan store QR</button>`;
            actionsEl.querySelector('[data-suki-scan]')?.addEventListener('click', () => openScanner(livePlace));
            actionsEl.querySelector('[data-suki-retry]')?.addEventListener('click', () => mountPlaceSection(livePlace, false));
            actionsEl.querySelectorAll('[data-suki-cancel-req]').forEach(button =>
                button.addEventListener('click', () => cancelRequest(button.getAttribute('data-suki-cancel-req'))));
            window.debouncedIcons?.();
        };
        window.SukiPlaceMarkPending = value => {
            if (!stillWatching() || value.placeId !== livePlace.id) return;
            latestPending = value;
            requestError = false;
            displayRequestActions();
        };
        window.SukiPlaceSubmissionState = value => {
            if (!stillWatching()) return;
            submitting = value === 'sending';
            displayRequestActions();
        };
        if (typeof window.db.collection('loyalty_cards').doc(cardId).onSnapshot === 'function') {
            const stop = window.db.collection('loyalty_cards').doc(cardId).onSnapshot(snap => {
                if (!stillWatching()) return;
                const nextCard = snap.exists ? { cardId, id: snap.id, ...snap.data() }
                    : { cardId, stamps: 0, claimed: false, claimRequested: false, customerName: customerDisplayName() };
                const version = JSON.stringify([nextCard.stamps, nextCard.claimed, nextCard.claimRequested, nextCard.customerName]);
                if (lastCardVersion === version) return;
                const previousStamps = Number(card.stamps) || 0;
                const nextStamps = Number(nextCard.stamps) || 0;
                Object.assign(card, nextCard);
                lastCardVersion = version;
                if (previewEl) {
                    previewEl.innerHTML = renderCard(livePlace, nextCard);
                    attachInteraction(previewEl);
                }
                if (nextStamps > previousStamps) window.showToast?.('Suki stamp added! 🎉', 'success');
            }, error => {
                if (stillWatching()) console.warn('[suki] live card updates interrupted:', error);
            });
            sukiPlaceLiveStops.push(stop);
        }
        // Prefer the existing composite index. On older Firebase projects
        // without that deployed index, subscribe to this customer's requests
        // and filter locally so approval still appears without a refresh.
        const watchPending = (fallback = false) => {
            let q = window.db.collection('stamp_requests');
            q = fallback ? q.where('customerUid', '==', uid)
                : q.where('placeId', '==', livePlace.id).where('customerUid', '==', uid).where('status', '==', 'pending').limit(1);
            if (typeof q.onSnapshot !== 'function') return;
            const stop = q.onSnapshot(snapshot => {
                if (!stillWatching()) return;
                const found = fallback ? snapshot.docs.find(doc => {
                    const value = doc.data();
                    return value.placeId === livePlace.id && value.status === 'pending';
                }) : snapshot.docs[0];
                latestPending = found ? { id: found.id, ...found.data() } : null;
                requestError = false;
                displayRequestActions();
            }, error => {
                if (!stillWatching()) return;
                if (!fallback && error?.code === 'failed-precondition') {
                    console.warn('[suki] pending-request index missing; using customer-scoped real-time fallback.');
                    watchPending(true);
                } else {
                    requestError = true;
                    displayRequestActions();
                    console.warn('[suki] live request status unavailable:', error);
                }
            });
            sukiPlaceLiveStops.push(stop);
        };
        watchPending();
        window.SukiPlaceRefresh = () => { if (stillWatching()) displayRequestActions(); };
    }

    return {
        designOf, textTone, renderCard, attachInteraction,
        makeToken, parseToken, tokenValid, renderOwnerQr, openScanner,
        scanPlaceCoords, checkScanDistance, verifyScanLocation, SUKI_SCAN_RADIUS_M,
        requestStamp, cancelRequest, requestClaim,
        approveRequest, rejectRequest, markClaimed,
        mountPlaceSection, unmountPlaceSection, requestStampForPlaceId, customerDisplayName
    };
})();

// Reject non-photo selections before preview/upload handlers run.
if (typeof document !== 'undefined') document.addEventListener('change', function(event) {
 const input=event.target;
 if (!input?.matches?.('input[type="file"][accept*="image/"]')) return;
 const invalid=Array.from(input.files || []).some(file=>!file.type.startsWith('image/'));
 if(invalid){ input.value=''; event.stopImmediatePropagation(); window.showToast?.('Photos only. Please choose an image.', 'error'); }
}, true);


/* Remove any legacy floating AI dock from older builds/caches. */
(function(){
  function removeLegacyViciDock(){
    try {
      const dock = document.getElementById('viciFloatingDock');
      if (dock) dock.remove();
      const btn = document.getElementById('locateBtn');
      if (btn) {
        btn.classList.remove('vici-ai-bubble-launcher');
        btn.removeAttribute('data-vici-launcher');
        btn.hidden = false;
      }
    } catch (_) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeLegacyViciDock, { once:true });
  } else {
    removeLegacyViciDock();
  }
  window.addEventListener('pageshow', removeLegacyViciDock);
  window.addEventListener('focus', removeLegacyViciDock);
})();

