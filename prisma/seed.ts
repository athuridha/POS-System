import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Starting database seed for POS Cafe...');

  // ─── 1. Users ─────────────────────────────────────────────
  console.log('👤 Seeding users...');
  const superAdminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const kasirPassword = await bcrypt.hash('kasir123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@poscafe.id' },
    update: { nama: 'Super Admin', role: 'super_admin' },
    create: {
      email: 'superadmin@poscafe.id',
      passwordHash: superAdminPassword,
      nama: 'Super Admin',
      role: 'super_admin',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@poscafe.id' },
    update: { nama: 'Rendra Mahardika', role: 'manager' },
    create: {
      email: 'manager@poscafe.id',
      passwordHash: managerPassword,
      nama: 'Rendra Mahardika',
      role: 'manager',
    },
  });

  const kasir1 = await prisma.user.upsert({
    where: { email: 'kasir1@poscafe.id' },
    update: { nama: 'Dita Pramesti', role: 'kasir' },
    create: {
      email: 'kasir1@poscafe.id',
      passwordHash: kasirPassword,
      nama: 'Dita Pramesti',
      role: 'kasir',
    },
  });

  const kasir2 = await prisma.user.upsert({
    where: { email: 'kasir2@poscafe.id' },
    update: { nama: 'Bagus Wicaksono', role: 'kasir' },
    create: {
      email: 'kasir2@poscafe.id',
      passwordHash: kasirPassword,
      nama: 'Bagus Wicaksono',
      role: 'kasir',
    },
  });

  const dapurPassword = await bcrypt.hash('dapur123', 10);
  const dapurUser = await prisma.user.upsert({
    where: { email: 'dapur@poscafe.id' },
    update: { nama: 'Chef & Barista Dapur', role: 'dapur' },
    create: {
      email: 'dapur@poscafe.id',
      passwordHash: dapurPassword,
      nama: 'Chef & Barista Dapur',
      role: 'dapur',
    },
  });

  console.log(`✅ Users ready: ${superAdmin.nama}, ${manager.nama}, ${kasir1.nama}, ${kasir2.nama}, ${dapurUser.nama}`);

  // ─── 2. Categories & Products ─────────────────────────────
  console.log('📁 Seeding categories & products...');
  
  const categoryDefinitions = [
    {
      namaKategori: 'Kopi (Espresso Based)',
      urutan: 1,
      products: [
        {
          namaProduk: 'Espresso Single Origin',
          hargaDasar: 18000,
          deskripsi: 'Single extraction 100% Arabica Specialty dengan crema tebal dan aroma floral citrus.',
          imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Single Shot', hargaTambahan: 0 },
            { namaVarian: 'Double Shot (Doppio)', hargaTambahan: 7000 },
          ],
        },
        {
          namaProduk: 'Americano / Long Black',
          hargaDasar: 22000,
          deskripsi: 'Double shot espresso dipadukan dengan air mineral dingin/panas, clean dan refreshing.',
          imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Hot', hargaTambahan: 0 },
            { namaVarian: 'Iced', hargaTambahan: 3000 },
            { namaVarian: 'Extra Shot', hargaTambahan: 6000 },
          ],
        },
        {
          namaProduk: 'Caffe Latte',
          hargaDasar: 28000,
          deskripsi: 'Espresso dipadukan dengan silky steamed fresh milk dan microfoam lembut.',
          imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Hot (Reguler)', hargaTambahan: 0 },
            { namaVarian: 'Iced (Reguler)', hargaTambahan: 3000 },
            { namaVarian: 'Iced + Oat Milk', hargaTambahan: 9000 },
            { namaVarian: 'Large + Extra Shot', hargaTambahan: 8000 },
          ],
        },
        {
          namaProduk: 'Cappuccino Classic',
          hargaDasar: 28000,
          deskripsi: 'Keseimbangan sempurna antara rich espresso, steamed milk, dan busa tebal bertabur cocoa powder.',
          imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Hot', hargaTambahan: 0 },
            { namaVarian: 'Iced', hargaTambahan: 3000 },
            { namaVarian: 'Cinamon Sprinkle', hargaTambahan: 2000 },
          ],
        },
        {
          namaProduk: 'Caramel Macchiato',
          hargaDasar: 34000,
          deskripsi: 'Fresh milk dengan vanilla syrup, espresso layer, dan drizzle saus karamel artisanal gurih manis.',
          imageUrl: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Hot', hargaTambahan: 0 },
            { namaVarian: 'Iced', hargaTambahan: 3000 },
            { namaVarian: 'Extra Caramel Drizzle', hargaTambahan: 5000 },
          ],
        },
        {
          namaProduk: 'Spanish Latte (Aren Macchiato)',
          hargaDasar: 30000,
          deskripsi: 'Espresso creamy dengan susu kental manis spesial & sirup gula aren murni organik.',
          imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Iced Reguler', hargaTambahan: 0 },
            { namaVarian: 'Iced Less Sweet', hargaTambahan: 0 },
            { namaVarian: 'Iced Large (Upsize)', hargaTambahan: 6000 },
          ],
        },
        {
          namaProduk: 'Mocha Latte Belgian',
          hargaDasar: 33000,
          deskripsi: 'Perpaduan bold espresso dengan real dark chocolate Belgia dan susu creamy gurih.',
          imageUrl: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Hot', hargaTambahan: 0 },
            { namaVarian: 'Iced', hargaTambahan: 3000 },
          ],
        },
        {
          namaProduk: 'Butterscotch Sea Salt Latte',
          hargaDasar: 36000,
          deskripsi: 'Signature latte dengan aroma butterscotch hangat dan taburan sea salt cream foam di atasnya.',
          imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Iced Reguler', hargaTambahan: 0 },
            { namaVarian: 'Iced + Cold Foam', hargaTambahan: 5000 },
          ],
        },
      ],
    },
    {
      namaKategori: 'Manual Brew & Cold Brew',
      urutan: 2,
      products: [
        {
          namaProduk: 'V60 Pour Over (Aceh Gayo Wine)',
          hargaDasar: 32000,
          deskripsi: 'Filter coffee teknik pour-over V60 dengan notes red wine, berry, dan aftertaste manis madu.',
          imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Hot Serving', hargaTambahan: 0 },
            { namaVarian: 'Japanese Iced Style', hargaTambahan: 3000 },
          ],
        },
        {
          namaProduk: 'Cold Brew Signature 12-Hour',
          hargaDasar: 29000,
          deskripsi: 'Ekstraksi dingin selama 12 jam, menghasilkan kopi yang halus (smooth), low acid, dan naturally sweet.',
          imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Black Cold Brew', hargaTambahan: 0 },
            { namaVarian: 'White / Sweet Cream', hargaTambahan: 4000 },
          ],
        },
        {
          namaProduk: 'Vietnamese Drip Coffee',
          hargaDasar: 25000,
          deskripsi: 'Kopi robusta pekat diseduh dengan dripper tradisional di atas susu kental manis lembut.',
          imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Hot', hargaTambahan: 0 },
            { namaVarian: 'Iced', hargaTambahan: 3000 },
          ],
        },
      ],
    },
    {
      namaKategori: 'Non-Kopi & Milk Based',
      urutan: 3,
      products: [
        {
          namaProduk: 'Matcha Uji Green Tea Latte',
          hargaDasar: 32000,
          deskripsi: 'Matcha ceremonial grade asli Kyoto Jepang berpadu dengan fresh milk gurih lembut.',
          imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Hot', hargaTambahan: 0 },
            { namaVarian: 'Iced', hargaTambahan: 3000 },
            { namaVarian: 'Iced + Oat Milk', hargaTambahan: 8000 },
          ],
        },
        {
          namaProduk: 'Signature Dark Chocolate',
          hargaDasar: 29000,
          deskripsi: 'Kakao 70% dark chocolate asli Indonesia diseduh lembut dengan susu murni tanpa rasa pahit berlebih.',
          imageUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Hot', hargaTambahan: 0 },
            { namaVarian: 'Iced', hargaTambahan: 3000 },
            { namaVarian: 'With Marshmallow', hargaTambahan: 5000 },
          ],
        },
        {
          namaProduk: 'Taro Velvet Cream Latte',
          hargaDasar: 28000,
          deskripsi: 'Rasa taro ungu creamy gurih berpadu dengan aroma vanila yang memanjakan lidah.',
          imageUrl: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Hot', hargaTambahan: 0 },
            { namaVarian: 'Iced', hargaTambahan: 3000 },
          ],
        },
        {
          namaProduk: 'Red Velvet Cheesecake Latte',
          hargaDasar: 30000,
          deskripsi: 'Sajian manis red velvet cake dengan sentuhan cream cheese foam gurih manis.',
          imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Hot', hargaTambahan: 0 },
            { namaVarian: 'Iced', hargaTambahan: 3000 },
          ],
        },
        {
          namaProduk: 'Cookies & Cream Frappe',
          hargaDasar: 35000,
          deskripsi: 'Blended Oreo cookies renyah dengan vanilla ice cream dan whipped cream lezat.',
          imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Reguler Size', hargaTambahan: 0 },
            { namaVarian: 'Large + Extra Oreo Crunch', hargaTambahan: 7000 },
          ],
        },
      ],
    },
    {
      namaKategori: 'Artisan Tea & Refreshers',
      urutan: 4,
      products: [
        {
          namaProduk: 'Lychee Iced Blossom Tea',
          hargaDasar: 24000,
          deskripsi: 'Seduhan teh melati premium berpadu dengan sirup leci manis dan buah leci utuh segar.',
          imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Iced Reguler', hargaTambahan: 0 },
            { namaVarian: 'With Basil Seeds & Jelly', hargaTambahan: 4000 },
          ],
        },
        {
          namaProduk: 'Peach Mint Sparkler Tea',
          hargaDasar: 26000,
          deskripsi: 'Artisan black tea dengan potongan peach segar, daun mint asli, dan sentuhan soda sejuk.',
          imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Iced Sparkling', hargaTambahan: 0 },
            { namaVarian: 'Still (Tanpa Soda)', hargaTambahan: 0 },
          ],
        },
        {
          namaProduk: 'Lemon Mint Sparkler',
          hargaDasar: 23000,
          deskripsi: 'Perasan jeruk lemon segar, daun mint murni, dan sparkling water penyegar dahaga.',
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Iced Reguler', hargaTambahan: 0 },
            { namaVarian: 'Less Sugar', hargaTambahan: 0 },
          ],
        },
        {
          namaProduk: 'Tropical Berry Mocktail',
          hargaDasar: 28000,
          deskripsi: 'Campuran buah strawberry, blueberry puree, jeruk nipis, dan tonic water dingin.',
          imageUrl: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Iced Mocktail', hargaTambahan: 0 },
          ],
        },
      ],
    },
    {
      namaKategori: 'Makanan Utama (Main Course)',
      urutan: 5,
      products: [
        {
          namaProduk: 'Nasi Goreng Spesial Cafe',
          hargaDasar: 38000,
          deskripsi: 'Nasi goreng bumbu rempah harum khas cafe, telur mata sapi, sate ayam, kerupuk udang & acar segar.',
          imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Sedang (Medium Spicy)', hargaTambahan: 0 },
            { namaVarian: 'Pedas Gila (Hot)', hargaTambahan: 0 },
            { namaVarian: 'Extra Sate Ayam (2 Tusuk)', hargaTambahan: 10000 },
          ],
        },
        {
          namaProduk: 'Nasi Wagyu Saikoro Sambal Matah',
          hargaDasar: 48000,
          deskripsi: 'Daging wagyu meltique saikoro empuk juicy ditumis bawang putih, disajikan dengan sambal matah Bali.',
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Tingkat Kematangan Medium', hargaTambahan: 0 },
            { namaVarian: 'Tingkat Kematangan Well Done', hargaTambahan: 0 },
            { namaVarian: 'Extra Onsen Egg', hargaTambahan: 5000 },
          ],
        },
        {
          namaProduk: 'Spaghetti Carbonara Smoked Beef',
          hargaDasar: 42000,
          deskripsi: 'Pasta al dente dalam saus krim kuning telur, keju parmesan Italia asli, dan irisan smoked beef gurih.',
          imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Original Creamy', hargaTambahan: 0 },
            { namaVarian: 'Spicy Creamy', hargaTambahan: 0 },
            { namaVarian: 'Extra Parmesan Cheese', hargaTambahan: 6000 },
          ],
        },
        {
          namaProduk: 'Spaghetti Aglio Olio Salmon',
          hargaDasar: 45000,
          deskripsi: 'Pasta ditumis dengan extra virgin olive oil, bawang putih cincang, chili flakes, dan potongan salmon segar.',
          imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Mild Chili', hargaTambahan: 0 },
            { namaVarian: 'Spicy Level 3', hargaTambahan: 0 },
            { namaVarian: 'Extra Garlic Bread', hargaTambahan: 8000 },
          ],
        },
        {
          namaProduk: 'Chicken Katsu Japanese Curry',
          hargaDasar: 40000,
          deskripsi: 'Fillet dada ayam goreng tepung panko renyah, saus kari kental ala Jepang, wortel, kentang & nasi hangat.',
          imageUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Kari Original', hargaTambahan: 0 },
            { namaVarian: 'Kari Pedas', hargaTambahan: 0 },
            { namaVarian: 'With Mozzarella Melt', hargaTambahan: 9000 },
          ],
        },
        {
          namaProduk: 'Club Sandwich Supreme',
          hargaDasar: 36000,
          deskripsi: 'Tiga lapis roti gandum panggang, grilled chicken fillet, smoked beef, keju cheddar, telur & french fries.',
          imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Roti Gandum (Wheat)', hargaTambahan: 0 },
            { namaVarian: 'Roti Putih (White)', hargaTambahan: 0 },
          ],
        },
        {
          namaProduk: 'Crispy Dori Fish Tartar Rice Bowl',
          hargaDasar: 37000,
          deskripsi: 'Fillet ikan dori goreng tepung keemasan disajikan dengan saus tartar homemade & nasi nori gurih.',
          imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Saus Tartar', hargaTambahan: 0 },
            { namaVarian: 'Saus Sambal Matah', hargaTambahan: 0 },
          ],
        },
      ],
    },
    {
      namaKategori: 'Snack & Finger Food',
      urutan: 6,
      products: [
        {
          namaProduk: 'Truffle Parmesan French Fries',
          hargaDasar: 26000,
          deskripsi: 'Kentang goreng shoestring renyah dengan aroma minyak truffle putih mewah & keju parmesan parut.',
          imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Original Truffle', hargaTambahan: 0 },
            { namaVarian: 'Cheese Sauce Dip', hargaTambahan: 4000 },
            { namaVarian: 'Large Portion (Share)', hargaTambahan: 12000 },
          ],
        },
        {
          namaProduk: 'Crispy Chicken Wings BBQ Honey',
          hargaDasar: 33000,
          deskripsi: 'Sayap ayam goreng renyah (6 pcs) dilumuri saus BBQ madu manis gurih & taburan biji wijen.',
          imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Honey BBQ Glaze', hargaTambahan: 0 },
            { namaVarian: 'Spicy Gochujang Glaze', hargaTambahan: 0 },
          ],
        },
        {
          namaProduk: 'Cireng Crispy Bumbu Rujak',
          hargaDasar: 20000,
          deskripsi: 'Cireng kenyal garing khas Sunda (8 pcs) disajikan dengan cocolan sambal rujak asam manis pedas.',
          imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Porsi Reguler (8 pcs)', hargaTambahan: 0 },
          ],
        },
        {
          namaProduk: 'Pisang Goreng Madu Wijen Keju',
          hargaDasar: 24000,
          deskripsi: 'Pisang raja manis digoreng karamel madu renyah, ditaburi parutan keju cheddar melimpah & susu.',
          imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Keju Susu', hargaTambahan: 0 },
            { namaVarian: 'Keju Cokelat Brown Sugar', hargaTambahan: 3000 },
          ],
        },
        {
          namaProduk: 'Dimsum Ayam Udang Mentai',
          hargaDasar: 27000,
          deskripsi: 'Dimsum siomay kukus lembut isi daging ayam udang (4 pcs) dengan topping saus mentai bakar harum.',
          imageUrl: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Saus Mentai Torched', hargaTambahan: 0 },
            { namaVarian: 'Chili Oil Original', hargaTambahan: 0 },
          ],
        },
      ],
    },
    {
      namaKategori: 'Pastry & Bakery',
      urutan: 7,
      products: [
        {
          namaProduk: 'Artisan Butter Croissant',
          hargaDasar: 25000,
          deskripsi: 'Croissant khas Prancis berlapis renyah luar dengan adonan mentega premium lembut di dalam.',
          imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Plain Butter', hargaTambahan: 0 },
            { namaVarian: 'Warm with Butter Jam', hargaTambahan: 3000 },
          ],
        },
        {
          namaProduk: 'Pain Au Chocolat',
          hargaDasar: 28000,
          deskripsi: 'Pastry renyah dengan isian dua batang cokelat dark Belgia yang meleleh sempurna saat dihangatkan.',
          imageUrl: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Standard Heated', hargaTambahan: 0 },
          ],
        },
        {
          namaProduk: 'Basque Burnt Cheesecake Slice',
          hargaDasar: 35000,
          deskripsi: 'Cheesecake panggang khas Basque Spanyol dengan permukaan karamel gelap dan tekstur tengah molten creamy.',
          imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Original Creamy', hargaTambahan: 0 },
            { namaVarian: 'Berry Compote Topping', hargaTambahan: 5000 },
          ],
        },
        {
          namaProduk: 'Fudgy Choco Brownies with Ice Cream',
          hargaDasar: 32000,
          deskripsi: 'Brownies cokelat panggang fudgy pekat disajikan hangat dengan satu scoop es krim vanila lembut.',
          imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Vanilla Ice Cream', hargaTambahan: 0 },
            { namaVarian: 'Matcha Ice Cream', hargaTambahan: 3000 },
          ],
        },
        {
          namaProduk: 'Authentic Tiramisu Jar',
          hargaDasar: 36000,
          deskripsi: 'Ladyfinger biskuit direndam espresso kuat dilapisi mascarpone cheese sabayon dan cocoa powder murni.',
          imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&auto=format&fit=crop&q=80',
          variants: [
            { namaVarian: 'Single Jar (200ml)', hargaTambahan: 0 },
          ],
        },
      ],
    },
  ];

  let totalCategories = 0;
  let totalProducts = 0;
  let totalVariants = 0;

  for (const catDef of categoryDefinitions) {
    // Upsert Category
    let category = await prisma.category.findFirst({
      where: { namaKategori: catDef.namaKategori },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          namaKategori: catDef.namaKategori,
          urutan: catDef.urutan,
          isActive: true,
        },
      });
    } else {
      category = await prisma.category.update({
        where: { id: category.id },
        data: {
          urutan: catDef.urutan,
          isActive: true,
        },
      });
    }
    totalCategories++;

    // Seed Products
    for (const prodDef of catDef.products) {
      let product = await prisma.product.findFirst({
        where: {
          namaProduk: prodDef.namaProduk,
          categoryId: category.id,
        },
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            categoryId: category.id,
            namaProduk: prodDef.namaProduk,
            hargaDasar: prodDef.hargaDasar,
            deskripsi: prodDef.deskripsi,
            imageUrl: prodDef.imageUrl,
            isActive: true,
          },
        });
      } else {
        product = await prisma.product.update({
          where: { id: product.id },
          data: {
            hargaDasar: prodDef.hargaDasar,
            deskripsi: prodDef.deskripsi,
            imageUrl: prodDef.imageUrl,
            isActive: true,
          },
        });
      }
      totalProducts++;

      // Seed Variants
      if (prodDef.variants && prodDef.variants.length > 0) {
        for (const varDef of prodDef.variants) {
          const existingVariant = await prisma.productVariant.findFirst({
            where: {
              productId: product.id,
              namaVarian: varDef.namaVarian,
            },
          });

          if (!existingVariant) {
            await prisma.productVariant.create({
              data: {
                productId: product.id,
                namaVarian: varDef.namaVarian,
                hargaTambahan: varDef.hargaTambahan,
                isActive: true,
              },
            });
          } else {
            await prisma.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                hargaTambahan: varDef.hargaTambahan,
                isActive: true,
              },
            });
          }
          totalVariants++;
        }
      }
    }
  }

  console.log(`✅ Menu ready: ${totalCategories} Categories, ${totalProducts} Products, ${totalVariants} Variants.`);

  // ─── 3. Tables (Meja) ─────────────────────────────────────
  console.log('🪑 Seeding tables...');
  const tableDefinitions = [
    // Indoor Tables
    { nomorMeja: 'M01', kapasitas: 2 },
    { nomorMeja: 'M02', kapasitas: 2 },
    { nomorMeja: 'M03', kapasitas: 4 },
    { nomorMeja: 'M04', kapasitas: 4 },
    { nomorMeja: 'M05', kapasitas: 4 },
    { nomorMeja: 'M06', kapasitas: 4 },
    { nomorMeja: 'M07', kapasitas: 6 },
    { nomorMeja: 'M08', kapasitas: 6 },
    { nomorMeja: 'M09', kapasitas: 6 },
    { nomorMeja: 'M10', kapasitas: 8 },
    // Outdoor Terrace Tables
    { nomorMeja: 'OUT-01', kapasitas: 4 },
    { nomorMeja: 'OUT-02', kapasitas: 4 },
    { nomorMeja: 'OUT-03', kapasitas: 4 },
    { nomorMeja: 'OUT-04', kapasitas: 6 },
    // VIP Meeting Rooms
    { nomorMeja: 'VIP-01', kapasitas: 10 },
    { nomorMeja: 'VIP-02', kapasitas: 12 },
  ];

  let totalTables = 0;
  for (const t of tableDefinitions) {
    await prisma.table.upsert({
      where: { nomorMeja: t.nomorMeja },
      update: { kapasitas: t.kapasitas },
      create: {
        nomorMeja: t.nomorMeja,
        kapasitas: t.kapasitas,
        status: 'kosong',
      },
    });
    totalTables++;
  }
  console.log(`✅ Tables ready: ${totalTables} Tables.`);

  // ─── 4. Sample Discounts & Vouchers ────────────────────────
  console.log('🏷️ Seeding discount vouchers...');
  const discountDefinitions = [
    {
      kodeVoucher: 'WELCOME10',
      tipe: 'persentase',
      nilai: 10,
      minBelanja: 30000,
      isActive: true,
    },
    {
      kodeVoucher: 'HEMAT20K',
      tipe: 'nominal',
      nilai: 20000,
      minBelanja: 100000,
      isActive: true,
    },
    {
      kodeVoucher: 'NGOPIHEMAT',
      tipe: 'nominal',
      nilai: 5000,
      minBelanja: 25000,
      isActive: true,
    },
    {
      kodeVoucher: 'LUNCHDEAL',
      tipe: 'persentase',
      nilai: 15,
      minBelanja: 60000,
      isActive: true,
    },
  ];

  let totalDiscounts = 0;
  for (const d of discountDefinitions) {
    await prisma.discount.upsert({
      where: { kodeVoucher: d.kodeVoucher },
      update: {
        tipe: d.tipe,
        nilai: d.nilai,
        minBelanja: d.minBelanja,
        isActive: d.isActive,
      },
      create: d,
    });
    totalDiscounts++;
  }
  console.log(`✅ Discounts ready: ${totalDiscounts} Vouchers.`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
