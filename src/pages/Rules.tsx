import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

export default function Rules() {
  return (
    <div className="min-h-screen overflow-x-hidden relative">
      <Navbar />
      {/* Animated media-like background */}
      <div className="absolute inset-0 -z-10 bg-animated opacity-50" />

      <div className="container mx-auto p-6 pt-24 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Umumiy server qoidalari va jazo haqida ma'lumot</h1>
          <Link to="/bytemc" className="text-sm text-crypto-purple hover:underline">Bosh sahifa</Link>
        </div>

        <p className="text-gray-300 mb-6">Quyidagi qoidalar ByteMC serveri uchun amal qiladi. Har bir bandga mos tarzda jazo qo'llanadi. Qoidalar moderatsiya sifati va hamjamiyat madaniyatini saqlash uchun zarur.</p>

        {/* Sections */}
        <div className="space-y-6">
          <section className="bg-card/80 rounded border border-gray-700 p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">A. Hurmat va muomala</h2>
            <ul className="space-y-2 text-sm leading-relaxed">
              <li>A.1 Server ishchilariga haqoratnomuz so'zlarni ishlatish taqiqlanadi, shaxsiyatiga tegish yoki ishiga halaqit berishga urinish mumkin emas. (ban 1 kun)</li>
              <li>A.2 Chat/msg/broadcastda oila a'zolariga (ota-ona, bobo-buvi) so'kinish yoki oila a'zo orqali o'yinchining or-nomusi, shaniga tegish mumkin emas. (mute 10 minutdan - 2 soatgacha)</li>
            </ul>
          </section>

          <section className="bg-card/80 rounded border border-gray-700 p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">B. Chat tartibi</h2>
            <ul className="space-y-2 text-sm leading-relaxed">
              <li>B.1 Rejim chatida bir xabarni tez-tez va qayta yuborish (flood/spam) mumkin emas. (mute 2 minutdan - 20 minutgacha; takrorlansa 2 soat)</li>
              <li>B.2 Shaxsiy xabar (msg) chatida bir so'zni qayta-qayta va tez yuborish taqiqlanadi. (mute 2 minutdan - 20 minutgacha; takrorlansa 20 minutdan - 2 soatgacha)</li>
              <li>B.3 Chat/msg/broadcastda reklama tarqatish (server/sayt/IP manzili yozish) taqiqlanadi. (mute 2 soatdan - 1 kungacha)</li>
            </ul>
          </section>

          <section className="bg-card/80 rounded border border-gray-700 p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">C. Bag/lag(g) va suiste'mol</h2>
            <ul className="space-y-2 text-sm leading-relaxed">
              <li>C.1 Bag/lag(g) dan foydalanib ko'paytirish (dupe) taqiqlanadi. (ban 5–14 kun; takrorlansa IP ban 14–30 kun)</li>
              <li>C.2 Bag/lag(g) mexaniya/mechaniya yasash yoki serverni qotirishga urinish mumkin emas. (ban 14–30 kun; takrorlansa IP ban 30–90 kun)</li>
              <li>C.3 Plugin yoki serverdan bag/lag(g) topib, xabar qilmaslik yoki undan foydalanish mumkin emas. (ban 20 minutdan – 4 kun; takrorlansa 7 kun ban)</li>
            </ul>
          </section>

          <section className="bg-card/80 rounded border border-gray-700 p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">D. Tekshiruv tartibi</h2>
            <ul className="space-y-2 text-sm leading-relaxed">
              <li>D.1 Moderator/helper/admin tekshiruviga chaqirilganda javob bermaslik yoki serverdan chiqib ketish taqiqlanadi (afk holat istisno). (ban 2 kun; takrorlansa 5 kun)</li>
              <li>D.2 Tekshiruvda anydesk kodi bermaslik yoki aldash taqiqlanadi. (ban 2–5 kun; takrorlansa 14 kun)</li>
              <li>D.3 Anydesk kodini xato berish yoki moderator/adminni aldash taqiqlanadi. (ban 2 kun; takrorlansa 7 kun)</li>
            </ul>
          </section>

          <section className="bg-card/80 rounded border border-gray-700 p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">E. Tekshiruv jarayonida to'siq</h2>
            <ul className="space-y-2 text-sm leading-relaxed">
              <li>E.1 Tekshiruvda sichqonchani ishlatishga ruxsat bermaslik yoki aldab bahona qilish taqiqlanadi. (ban 5–7 kun; takrorlansa 14 kun)</li>
              <li>E.2 Moderator/admin ochmoqchi bo'lgan fayl yoki ilovalarni ochishga to'siq qo'yish taqiqlanadi. (ban 2–5 kun; takrorlansa 7 kun)</li>
              <li>E.3 Tekshiruv vaqtida anydeskni o'chirib qo'yish. (ogohlantirish; javobsiz qoldirilsa ban 4 kun)</li>
            </ul>
          </section>

          <section className="bg-card/80 rounded border border-gray-700 p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">F. Serverga zararli harakatlar</h2>
            <ul className="space-y-2 text-sm leading-relaxed">
              <li>F.1 Chit borligini tan olish. (ban 1 kun)</li>
              <li>F.2 Serverni haqorat qilish yoki serverga shikast yetkazish haqida xabar tarqatish. (ban 14 kun)</li>
            </ul>
          </section>

          <section className="bg-card/80 rounded border border-gray-700 p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">G. Moderator/helper/admin uchun qoidalar</h2>
            <ul className="space-y-2 text-sm leading-relaxed">
              <li>G.1 Moderator+/helper/moderator sababsiz ban/mute bersa yoki qoida bo'yicha ish ko'rmasa, hamda qoidadagi muddatdan oshiq ban/mute bersa — ishidan ozod qilinadi.</li>
              <li>G.2 O'yinchilar/mijozlar bilan qo'pol muomalada bo'lish taqiqlanadi. (ogohlantirish; takrorlansa ishidan ozod qilinadi)</li>
              <li>G.3 Donate-buyruqlardan sababsiz foydalanib o'yinchiga teleport bo'lish yoki tahdid qilib qo'rqitish taqiqlanadi. (ishidan ozod qilinadi)</li>
              <li>G.4 Admin ko'rsatmalariga rioya qilish va javob berish shart. (hayfsan; 2 ta hayfsan = ishidan ozod qilinish)</li>
            </ul>
          </section>
        </div>

        <p className="text-xs text-gray-500 mt-6">Izoh: Qoidalar server moderatsiyasi tomonidan yangilanishi mumkin. Oxirgi yangilanishni e'lonlar bo'limidan kuzatib boring.</p>
      </div>

      <Footer />
    </div>
  );
}