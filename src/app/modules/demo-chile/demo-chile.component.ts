import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Product {
  id: number;
  name: string;
  category: 'tracksuit' | 'tshirt' | 'shorts';
  collection: 'winter' | 'summer';
  price: number;
  images: string[];
  color: string;
  colorHex?: string;
  sizes: string[];
  description: string;
  featured?: boolean;
  isNew?: boolean;
}

interface PromoEvent {
  id: number;
  title: string;
  location: string;
  date: string;
  description: string;
  image?: string;
}

@Component({
  selector: 'app-demo-chile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demo-chile.component.html',
  styleUrls: ['./demo-chile.component.scss']
})
export class DemoChileComponent {
  // Navigation
  activeSection = 'chile';
  
  // Generate 50 floating hearts with random positions and styles
  floatingHearts = Array.from({ length: 50 }, (_, i) => ({
    index: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 1.5,
    opacity: 0.3 + Math.random() * 0.3,
    delay: i * 0.2,
    duration: 10 + Math.random() * 10
  }));
  
  // Brand Story
  brandStory = {
    title: 'Priča o Chile brendu',
    text: `Vreme je da vas zvanično upoznam sa novim domaćim brendom CHILE koji je novi deo oversized kulture. Verujem da je važno imati poverenja u brend u koji nosite, što iziskuje biti upoznat sa licem koje stoji iza njega, kao i sa pričom koju nosi...

Ideja osnivanja ovakvog koncepta stoji iza želje da nastavim dugogodišnju porodičnu tradiciju koja je povezana sa tekstilom i najkvalitetnijim materijalima na našem tržištu, samo - na moj način. "Chile" predstavlja moderan nastavak nasleđa koje ide u korak sa vremenom. Zahvaljujući ogromnom poslovnom iskustvu koje se u porodici neguje već godinama, "Chile" trenerke izrađene su sa pažnjom na najsitnije detalje, a što je najvažnije sa puno ljubavi.

Zašto baš CHILE? Mislim da slika govori više od hiljadu reči. Kada se Tara rodila, postao sam najsrećniji 'čiča' na svetu. Stoga, za sve je zadužena ona koja je najpre mene nazvala Čile, a ostalo je istorija.

I ne zaboravite - život je igra u kojoj je najvažnije sačuvati duh deteta. Upravo u to ovaj brend veruje.

Hvala na pažnji!
Vaš Chile, Tara i Chile Family.`,
    mainImage: 'main-story-photo/Screenshot 2025-11-20 234326.png'
  };

  // Products organized by collection with all color variations
  winterCollection: Product[] = [
    // Tracksuits - multiple colors
    {
      id: 1,
      name: 'Chile Oversized Set',
      category: 'tracksuit',
      collection: 'winter',
      price: 8999,
      images: ['group-photo/Screenshot 2025-11-20 234404.png'],
      color: 'Burgundy',
      colorHex: '#8B1538',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Zimska oversized trenerka, futrovana iznutra za maksimalnu toplinu i udobnost.',
      featured: true,
      isNew: true
    },
    {
      id: 2,
      name: 'Chile Oversized Set',
      category: 'tracksuit',
      collection: 'winter',
      price: 8999,
      images: ['single-person-photo/Screenshot 2025-11-20 234615.png'],
      color: 'Black',
      colorHex: '#1a1a1a',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Klasična crna zimska trenerka sa finom futrovinom.',
      featured: true
    },
    {
      id: 3,
      name: 'Chile Oversized Set',
      category: 'tracksuit',
      collection: 'winter',
      price: 8999,
      images: ['single-person-photo/Screenshot 2025-11-20 234637.png'],
      color: 'Grey',
      colorHex: '#808080',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Siva zimska trenerka, savršena za svakodnevno nošenje.',
      featured: true
    },
    {
      id: 4,
      name: 'Chile Oversized Set',
      category: 'tracksuit',
      collection: 'winter',
      price: 8999,
      images: ['single-person-photo/Screenshot 2025-11-20 234643.png'],
      color: 'Navy',
      colorHex: '#1e3a5f',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Teget zimska trenerka sa premium futrovinom.'
    },
    {
      id: 5,
      name: 'Chile Oversized Set',
      category: 'tracksuit',
      collection: 'winter',
      price: 8999,
      images: ['single-person-photo/Screenshot 2025-11-20 234702.png'],
      color: 'Brown',
      colorHex: '#6B4423',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Braon zimska trenerka, topla i moderna.'
    },
    {
      id: 6,
      name: 'Chile Oversized Set',
      category: 'tracksuit',
      collection: 'winter',
      price: 8999,
      images: ['group-photo/Screenshot 2025-11-20 234404.png'],
      color: 'Beige',
      colorHex: '#D4C5B0',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Bež zimska trenerka sa premium futrovinom.'
    },
    // T-Shirts - multiple colors
    {
      id: 7,
      name: 'Chile Oversized Majica',
      category: 'tshirt',
      collection: 'winter',
      price: 3499,
      images: ['single-person-photo/Screenshot 2025-11-20 234509.png'],
      color: 'Burgundy',
      colorHex: '#8B1538',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Oversized majica sa čičaglisa logom.'
    },
    {
      id: 8,
      name: 'Chile Oversized Majica',
      category: 'tshirt',
      collection: 'winter',
      price: 3499,
      images: ['single-person-photo/Screenshot 2025-11-20 234509.png'],
      color: 'Black',
      colorHex: '#1a1a1a',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Crna oversized majica.'
    },
    // Shorts - multiple colors
    {
      id: 9,
      name: 'Chile Oversized Šorc',
      category: 'shorts',
      collection: 'winter',
      price: 4499,
      images: ['single-person-photo/Screenshot 2025-11-20 234840.png'],
      color: 'Grey',
      colorHex: '#808080',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Udoban oversized šorc.'
    },
    {
      id: 10,
      name: 'Chile Oversized Šorc',
      category: 'shorts',
      collection: 'winter',
      price: 4499,
      images: ['single-person-photo/Screenshot 2025-11-20 234840.png'],
      color: 'Black',
      colorHex: '#1a1a1a',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Crni oversized šorc.'
    }
  ];

  summerCollection: Product[] = [
    // Tracksuits - multiple colors
    {
      id: 11,
      name: 'Chile Oversized Set',
      category: 'tracksuit',
      collection: 'summer',
      price: 7499,
      images: ['group-photo/Screenshot 2025-11-20 234628.png'],
      color: 'Light Grey',
      colorHex: '#D3D3D3',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Letnja oversized trenerka od laganog materijala.',
      isNew: true
    },
    {
      id: 12,
      name: 'Chile Oversized Set',
      category: 'tracksuit',
      collection: 'summer',
      price: 7499,
      images: ['group-photo/Screenshot 2025-11-20 234628.png'],
      color: 'Burgundy',
      colorHex: '#8B1538',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Letnja oversized trenerka u burgundy boji.',
      isNew: true
    },
    // T-Shirts - multiple colors
    {
      id: 13,
      name: 'Chile Letnja Majica',
      category: 'tshirt',
      collection: 'summer',
      price: 2999,
      images: ['single-person-photo/Screenshot 2025-11-20 234709.png'],
      color: 'White',
      colorHex: '#FFFFFF',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Lagana letnja majica.'
    },
    {
      id: 14,
      name: 'Chile Letnja Majica',
      category: 'tshirt',
      collection: 'summer',
      price: 2999,
      images: ['single-person-photo/Screenshot 2025-11-20 234709.png'],
      color: 'Burgundy',
      colorHex: '#8B1538',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Burgundy letnja majica.'
    },
    // Shorts - multiple colors
    {
      id: 15,
      name: 'Chile Letnji Šorc',
      category: 'shorts',
      collection: 'summer',
      price: 3999,
      images: ['single-person-photo/Screenshot 2025-11-20 234840.png'],
      color: 'Beige',
      colorHex: '#D4C5B0',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Lagani letnji šorc.'
    },
    {
      id: 16,
      name: 'Chile Letnji Šorc',
      category: 'shorts',
      collection: 'summer',
      price: 3999,
      images: ['single-person-photo/Screenshot 2025-11-20 234840.png'],
      color: 'Grey',
      colorHex: '#808080',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: 'Sivi letnji šorc.'
    }
  ];

  // Promotional Events
  promoEvents: PromoEvent[] = [
    {
      id: 1,
      title: 'Chile Pop-Up Store',
      location: 'Ušće Shopping Center',
      date: 'Decembar 2025',
      description: 'Posetite nas u Ušće Shopping Centru i probajte našu novu zimsku kolekciju!'
    },
    {
      id: 2,
      title: 'Zimska Promocija',
      location: 'BIG Shopping Center',
      date: 'Januar 2026',
      description: 'Specijalne cene na celu zimsku kolekciju. Ne propustite!'
    }
  ];

  // All products combined
  get allProducts(): Product[] {
    return [...this.winterCollection, ...this.summerCollection];
  }

  get featuredProducts(): Product[] {
    return this.allProducts.filter(p => p.featured);
  }

  get newProducts(): Product[] {
    return this.allProducts.filter(p => p.isNew);
  }

  cartCount = 0;
  favorites: number[] = [];
  selectedColors: { [key: string]: number } = {}; // Track selected color index for each product type

  setActiveSection(section: string) {
    this.activeSection = section;
    
    // Special case for 'chile' - scroll to top
    if (section === 'chile') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Scroll to section
    const element = document.getElementById(section);
    if (element) {
      const offset = 80; // Navbar height
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  // Get all color variations for a product type
  getColorVariations(productName: string, collection: 'winter' | 'summer'): Product[] {
    const products = collection === 'winter' ? this.winterCollection : this.summerCollection;
    return products.filter(p => p.name === productName);
  }

  // Get currently selected color for a product
  getSelectedProduct(productName: string, collection: 'winter' | 'summer'): Product {
    const key = `${productName}-${collection}`;
    const variations = this.getColorVariations(productName, collection);
    const selectedIndex = this.selectedColors[key] || 0;
    return variations[selectedIndex] || variations[0];
  }

  // Select a color variation
  selectColor(productName: string, collection: 'winter' | 'summer', colorIndex: number) {
    const key = `${productName}-${collection}`;
    this.selectedColors[key] = colorIndex;
  }

  addToCart(product: Product) {
    this.cartCount++;
    console.log('Added to cart:', product);
  }

  toggleFavorite(productId: number) {
    const index = this.favorites.indexOf(productId);
    if (index > -1) {
      this.favorites.splice(index, 1);
    } else {
      this.favorites.push(productId);
    }
  }

  isFavorite(productId: number): boolean {
    return this.favorites.includes(productId);
  }

  getImagePath(imagePath: string): string {
    // Normalize folder names (remove spaces, use hyphens)
    const normalizedPath = imagePath
      .replace('main-story photo/', 'main-story-photo/')
      .replace('group photo/', 'group-photo/')
      .replace('single person photo/', 'single-person-photo/');
    return `assets/chile/${normalizedPath}`;
  }
}
