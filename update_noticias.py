import requests
from bs4 import BeautifulSoup
import json
import datetime
import os
import time

URL = "https://www.puebla.tecnm.mx/category/publicaciones-pagina-principal/"
OUTPUT_FILE = "data/noticias.json"

def scrape_news():
    print(f"Fetching {URL}...")
    try:
        # User-Agent is important to avoid 403 Forbidden on some servers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(URL, headers=headers)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching URL: {e}")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')
    news_items = []
    
    # Attempt to find articles. 
    articles = soup.find_all('article')
    
    if not articles:
        print("No <article> tags found. Trying generic .post class...")
        articles = soup.select('.post')

    print(f"Found {len(articles)} articles.")

    for idx, article in enumerate(articles):
        # Title & Link
        title_tag = article.select_one('.entry-title a') or article.select_one('h2 a') or article.select_one('h3 a')
        if not title_tag:
            print(f"Skipping article {idx}: No title found")
            continue
            
        title = title_tag.get_text(strip=True)
        link = title_tag['href']
        
        # Date
        date_tag = article.select_one('time')
        date_str = datetime.date.today().isoformat()
        if date_tag and date_tag.has_attr('datetime'):
            date_str = date_tag['datetime'].strip()[:10] # YYYY-MM-DD

        # Image extraction (handling lazy loading)
        img_tag = article.select_one('img')
        image_url = "img/fondo.jpg" # Default fallback
        
        if img_tag:
            # List of attributes to check for the real image URL
            possible_attrs = ['data-src', 'data-lazy-src', 'data-original', 'src']
            
            for attr in possible_attrs:
                if img_tag.has_attr(attr):
                    val = img_tag[attr]
                    # If it's not a data URI (placeholder), use it
                    if val and not val.startswith('data:'):
                        image_url = val
                        break
            
            # If we still have a data URI or nothing, try srcset
            if (not image_url or image_url.startswith('data:')) and img_tag.has_attr('srcset'):
                 srcset = img_tag['srcset'].split(',')
                 if srcset:
                     # Usually format is "url size, url size", take the last one (usually largest) or first
                     # Let's take the first one for simplicity
                     image_url = srcset[0].strip().split(' ')[0]

        # Excerpt
        excerpt_tag = article.select_one('.entry-summary') or article.select_one('.entry-content')
        excerpt = "Sin resumen disponible."
        if excerpt_tag:
            excerpt = excerpt_tag.get_text(strip=True)
            if len(excerpt) > 150:
                excerpt = excerpt[:147] + "..."

        news_items.append({
            "id": idx + 1,
            "titulo": title,
            "fecha": date_str,
            "imagen": image_url,
            "resumen": excerpt,
            "contenido": "Contenido disponible en el enlace.", # Placeholder
            "url": link
        })

    return news_items

def save_news(news_items):
    # Ensure directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(news_items, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(news_items)} news items to {OUTPUT_FILE}")

if __name__ == "__main__":
    print("Iniciando actualización de noticias...")
    news = scrape_news()
    if news:
        save_news(news)
    else:
        print("No se encontraron noticias o hubo un error.")
