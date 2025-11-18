
// Footer social icons: using brand SVGs via SimpleIcons CDN for Telegram/Discord

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#12141C] pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4">
              Byte<span className="text-crypto-purple">MC</span>
            </h2>
            <p className="text-gray-400 mb-6 max-w-xs">
              O'zbek Minecraft serveri. Ban/mute ro'yxatlari va onlayn holatni shu yerda kuzating.
            </p>
            <div className="flex space-x-4 items-center">
              <a
                href="https://t.me/Byteadminuz"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="text-gray-400 hover:text-crypto-purple transition-colors"
                title="Telegram"
              >
                <img
                  src="https://cdn.simpleicons.org/telegram/9CA3AF"
                  alt="Telegram"
                  className="h-5 w-5 hover:opacity-90"
                />
              </a>
              <a
                href="https://discord.gg/dUUey4cc"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                className="text-gray-400 hover:text-crypto-purple transition-colors"
                title="Discord"
              >
                <img
                  src="https://cdn.simpleicons.org/discord/9CA3AF"
                  alt="Discord"
                  className="h-5 w-5 hover:opacity-90"
                />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-4">Bo'limlar</h3>
            <ul className="space-y-2">
              <li><a href="/bans" className="text-gray-400 hover:text-crypto-purple transition-colors">Banlar</a></li>
              <li><a href="/mutes" className="text-gray-400 hover:text-crypto-purple transition-colors">Mutelar</a></li>
              <li><a href="/admin" className="text-gray-400 hover:text-crypto-purple transition-colors">Admin</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-4">Ma'lumot</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-crypto-purple transition-colors">Server IP: bytemc.uz</a></li>
              <li>
                <a
                  href="https://discord.gg/dUUey4cc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-crypto-purple transition-colors"
                >
                  Discord: discord.gg/dUUey4cc
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-4">Aloqa</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://t.me/Byteadminuz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-crypto-purple transition-colors"
                >
                  Telegram: @Byteadminuz
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/bytemcshop_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-crypto-purple transition-colors"
                >
                  Telegram donat bot: @bytemcshop_bot
                </a>
              </li>
              <li><a href="#" className="text-gray-400 hover:text-crypto-purple transition-colors">Qo'llab-quvvatlash</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {currentYear} ByteMC. Barcha huquqlar himoyalangan.
            </p>
            <div className="flex space-x-6">
              <a href="#!" className="text-gray-400 hover:text-crypto-purple text-sm transition-colors">Terms of Service</a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple text-sm transition-colors">Privacy Policy</a>
              <a href="#!" className="text-gray-400 hover:text-crypto-purple text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
