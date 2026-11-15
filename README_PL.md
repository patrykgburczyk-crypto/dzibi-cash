# DziBi Cash – instrukcja uruchomienia (wersja 0.1)

## Co zawiera projekt
- PWA po polsku, dostosowane do iPhone'a.
- Dashboard, lista meczów, kursy 1X2, kalkulator przewagi i EV.
- Oznaczenie VALUE BET tylko przy przewadze co najmniej 5 pp i dodatnim EV.
- Historia lokalna z automatycznym usuwaniem szczegółów starszych niż 7 dni.
- Worker Cloudflare, który ukrywa klucz API po stronie serwera i buforuje odpowiedzi.
- Tryb DEMO, wyraźnie oznaczony jako dane przykładowe.

## Ważne ograniczenia
To jest działający szkielet MVP, nie gotowy system do obstawiania. Dane prognoz pobierane są z endpointu Predictions API-Football, a kursy z endpointu Odds. Dostępność zależy od ligi, meczu i bukmacherów zwracanych przez API. W tej wersji analizowany jest rynek 1X2. Nie ma jeszcze automatycznego rozliczania kuponów, raportów miesięcznych na serwerze ani porównania Betclic/Fortuna/STS.
Darmowy plan API-Football ma limit 100 zapytań dziennie; dlatego aplikacja pobiera maksymalnie 8 analizowanych spotkań na jedno odświeżenie. Buforowanie ogranicza ponowne zapytania.

## Krok 1 – darmowe konto API-Football
1. Wejdź na https://www.api-football.com/
2. Załóż konto i wybierz plan FREE.
3. W panelu znajdź klucz API (API Key).
4. Nie wklejaj klucza do publicznego kodu ani nie wysyłaj go w wiadomości.

## Krok 2 – darmowe konto Cloudflare
1. Wejdź na https://dash.cloudflare.com/ i załóż konto.
2. Zainstaluj Node.js na komputerze: https://nodejs.org/
3. Pobierz i rozpakuj ZIP projektu.
4. Otwórz terminal w folderze projektu i wpisz:
   `npm install -g wrangler`
5. Zaloguj się:
   `npx wrangler login`
6. Dodaj sekret API:
   `npx wrangler secret put API_FOOTBALL_KEY`
   Wklej klucz API-Football w terminalu (nie będzie widoczny podczas wpisywania).
7. Wdróż projekt:
   `npx wrangler deploy`

## Krok 3 – pliki PWA
W tym projekcie Cloudflare Worker obsługuje API, a pliki strony są w katalogu `public`. Skopiuj pliki `index.html`, `style.css`, `app.js`, `manifest.webmanifest` i `sw.js` do katalogu `public` przed wdrożeniem. Plik `public/icon.svg` już jest w tym katalogu.
Po wdrożeniu otwórz adres `https://NAZWA.twoja-subdomena.workers.dev`.

## Instalacja na iPhone
1. Otwórz wdrożony adres w Safari.
2. Naciśnij Udostępnij.
3. Wybierz „Dodaj do ekranu początkowego”.
4. Uruchamiaj DziBi Cash z ikony.

## Jak liczone jest Value Bet
- Surowe prawdopodobieństwa z API są normalizowane do sumy 100%.
- Prawdopodobieństwo implikowane kursu = 1/kurs; następnie jest normalizowane przez sumę 1/kurs dla 1, X, 2, co usuwa przybliżoną marżę rynku.
- Przewaga (edge) = prawdopodobieństwo modelu minus prawdopodobieństwo rynkowe po normalizacji.
- EV = prawdopodobieństwo modelu × kurs dziesiętny − 1.
- VALUE BET: edge ≥ 0,05 oraz EV > 0.

## Bezpieczeństwo i odpowiedzialność
Nie traktuj prognozy jako pewnego wyniku. Nie ma gwarancji zysku. Wartość statystyczna nie usuwa ryzyka przegranej. Wersja 0.1 nie składa zakładów i nie łączy się z kontem bukmachera.
