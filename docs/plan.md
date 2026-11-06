# Autolaskin – toteutussuunnitelma

## 1. Tavoite

Autolaskin on Vite-pohjainen verkkosovellus, jolla vertaillaan nykyisen auton ja suunnitellun uuden auton käyttökustannuksia sekä arvioidaan, millainen auton hankinta on säästöjen ja rahoituksen perusteella mahdollinen.

Keskeiset periaatteet:

- Laskenta on determinististä: samoilla lähtöarvoilla saadaan samat tulokset.
- Kaikki laskennan oletusarvot ovat näkyvissä ja käyttäjän muokattavissa.
- Jokaisessa laskentavaiheessa näytetään käytetyt kaavat ja välitulokset.
- Käyttäjä voi tarkistaa laskelmat käsin.
- Käyttäjä voi kirjoittaa yksinkertaisia omia kaavoja ja viitata niissä muihin soluihin.
- Tallennus on kevyt: PIN-koodi toimii laskelman tunnisteena, ei salasanana.

## 2. Tekninen rakenne

- Frontend: Vite, React ja TypeScript.
- Backend: Node.js ja TypeScript.
- Laskentamoottori: oma riippumaton TypeScript-paketti.
- Kaavamoottori: pieni turvallinen Excel-tyylinen lausekkeiden jäsennin ja laskija.
- Tallennus: yksi palvelimella oleva JSON-tiedosto.
- API: REST-rajapinta, josta tuotetaan OpenAPI-kuvaus.

Ehdotettu monorepo-rakenne:

- `apps/web` – käyttöliittymä
- `apps/api` – backend ja JSON-tallennus
- `packages/calculator` – auton kustannus- ja rahoituslaskenta
- `packages/formula-engine` – käyttäjän kaavojen jäsennys ja laskenta
- `packages/domain` – yhteiset tietomallit ja tyypit
- `docs/plan.md` – tämä suunnitelma

Tietokantaa ei tarvita MVP:ssä.

## 3. Käyttöliittymä: vaiheittainen laskentataulukko

Laskenta etenee vaiheittain. Jokaisessa vaiheessa on taulukko, jossa näkyvät vähintään:

| Sarake | Sisältö |
|---|---|
| Tunniste | Solun pysyvä tunniste, esimerkiksi A1 |
| Selite | Arvon nimi ja lyhyt kuvaus |
| Oletusarvo | Sovelluksen tarjoama lähtöarvo |
| Käyttäjän arvo | Käytössä oleva arvo, jota käyttäjä voi muuttaa |
| Yksikkö | Esimerkiksi km/v, l/100 km tai €/kWh |
| Kaava | Laskennallisen solun kaava |
| Tulos | Laskettu arvo |

Syöttösoluissa käyttäjä voi muuttaa arvoa. Laskennallisissa soluissa näytetään kaava ja tulos. Oletusarvoa ei piiloteta, vaan käyttäjä näkee, mitä oletusta sovellus käyttää.

Laskennallisen rivin kaava voidaan avata tarkempaan tarkasteluun. Käyttöliittymä näyttää myös kaavan käyttämät lähtöarvot, jotta tuloksen voi tarkistaa käsin.

Solujen tunnisteet ovat pysyviä ja riippumattomia taulukon rivijärjestyksestä tai näkyvästä järjestyksestä. Käyttöliittymän uudelleenjärjestely ei saa rikkoa käyttäjän kaavoja.

## 4. Käyttäjän omat kaavat

Toteutetaan pieni Excel-tyylinen kaavakieli. MVP:ssä tuetaan:

- yhteenlasku `+`
- vähennyslasku `-`
- kertolasku `*`
- jakolasku `/`
- sulut `(` ja `)`
- viittaukset muihin soluihin, esimerkiksi `A1` ja `B4`

Esimerkkejä:

```text
=A1*A2/100
=(A1+B1)*C1
=D4-E4
=(A1-B1)/(C1+D1)
```

Laskujärjestys on tavanomainen: sulut ensin, sitten kertolasku ja jakolasku, lopuksi yhteen- ja vähennyslasku. Yhtä etusijaa käyttävät operaatiot lasketaan vasemmalta oikealle.

Kaavamoottori:

- jäsentää lausekkeet omalla parserilla
- ratkaisee soluviittaukset tunnisteiden perusteella
- muodostaa riippuvuudet ja laskee solut oikeassa järjestyksessä
- päivittää riippuvat tulokset, kun lähtöarvo muuttuu
- tunnistaa tuntemattomat soluviittaukset
- tunnistaa kehämäiset viittaukset
- tunnistaa jakamisen nollalla ja syntaksivirheet
- näyttää virheen kyseisessä solussa ymmärrettävästi

Käyttäjän syöttämää kaavaa ei suoriteta JavaScriptin `eval`-toiminnolla. MVP ei sisällä Excel-funktioita, ehtolauseita, makroja, tekstioperaatioita eikä ulkoisia tiedostoviittauksia.

## 5. Laskennan vaiheet

### Vaihe 1: nykyinen auto

Syöttöarvot sisältävät ainakin:

- merkki, malli ja vuosimalli
- ajokilometrit yhteensä
- vuosittainen ajomäärä
- polttoaineen kulutus (l/100 km)
- polttoaineen litrahinta
- ajoneuvovero
- vakuutukset
- huollot ja korjaukset
- renkaat
- arvioitu arvonalenema
- arvioitu vaihtohyvitys

Lasketaan ja näytetään:

- vuosittainen polttoaineenkulutus
- vuosittaiset polttoainekulut
- muut käyttökustannukset
- kokonaiskäyttökustannukset vuodessa
- kustannukset kuukaudessa
- kustannukset kilometriä kohti

Kaavat ja välitulokset näkyvät taulukossa.

### Vaihe 2: suunniteltu uusi auto

Tuettavat käyttövoimat:

- polttomoottoriauto
- täyshybridi
- ladattava hybridi
- täyssähköauto

Sähköauton syöttöarvot:

- sähkönkulutus (kWh/100 km)
- kotilatauksen osuus
- julkisen latauksen osuus
- lataushinnat lataustavoittain
- lataushäviöt
- ajoneuvovero
- vakuutukset
- huollot ja renkaat
- arvioitu arvonalenema

Hybridille huomioidaan polttoainekulutus. Ladattavassa hybridissä huomioidaan lisäksi sähkönkulutus sekä sähkö- ja polttoaineajon osuudet ja kustannukset.

Lasketaan samat kustannusnäkymät kuin nykyiselle autolle. Käyttövoimatyypin mukaan tarpeettomat syöttökentät eivät näy aktiivisina, mutta niiden arvot eivät saa vahingossa vaikuttaa laskentaan.

### Vaihe 3: säästöt

Lasketaan kaksi erillistä säästölukua:

**Energiakustannusten säästö**

Nykyisen auton polttoaine- ja energiakustannukset miinus uuden auton polttoaine- ja energiakustannukset.

**Kokonaiskäyttökustannusten säästö**

Nykyisen auton kaikki vertailuun sisällytetyt käyttökustannukset miinus uuden auton vastaavat käyttökustannukset.

Käyttäjä valitsee, kumpaa säästölukua käytetään takaisinmaksulaskennan pohjana. Käyttäjä valitsee myös lyhennyksiin käytettävän osuuden säästöstä, esimerkiksi 100 %, 90 %, 80 %, 70 % tai 50 %, tai antaa oman prosenttiluvun.

Näytetään molemmat säästölaskelmat, valittu peruste, käytetty prosenttiosuus ja niiden vaikutus kuukausittaiseen lyhennysvaraan.

Käyttökustannusten säästöön ei sisällytetä uuden auton hankintahintaa tai rahoituseriä, jotta hankintaa ei lasketa kahteen kertaan.

### Vaihe 4: rahoitus ja enimmäishankintahinta

Syöttöarvot:

- takaisinmaksuaika
- vuosikorko
- mahdolliset rahoituksen avaus- ja kuukausikulut
- säästöistä lyhennyksiin käytettävä osuus
- nykyisen auton vaihtohyvitys
- mahdollinen käsiraha
- toimituskulut ja muut hankinnan kulut

Kuukausittainen maksukyky muodostetaan valitusta kuukausisäästöstä ja vähennetään mahdolliset kuukausittaiset rahoituskulut siitä summasta, joka voidaan käyttää varsinaiseen annuiteettierään.

Annuiteetin kuukausierä:

```text
M = P * r / (1 - (1 + r)^(-n))
```

missä:

- M = kuukausierä
- P = lainapääoma
- r = kuukausikorko
- n = maksuerien lukumäärä

Nollakorolla:

```text
M = P / n
```

Kun käytettävissä oleva kuukausierä tunnetaan, enimmäislainapääoma:

```text
P = M * (1 - (1 + r)^(-n)) / r
```

Nollakorolla:

```text
P = M * n
```

Korkokäytäntö määritellään eksplisiittisesti. MVP:ssä vuosikorko tulkitaan nimelliseksi vuosikoroksi ja kuukausikorko saadaan jakamalla se kahdellatoista. Tämä oletus näytetään käyttäjälle.

Enimmäishankintahinta lasketaan enimmäisrahoituksen, vaihtohyvityksen ja käsirahan perusteella sekä vähentämällä toimitus- ja muut hankintakulut. Kaava ja kaikki käytetyt lähtöarvot näytetään käyttäjälle.

## 6. Kaavojen ja välitulosten esittäminen

Jokaisessa vaiheessa käyttäjä näkee:

1. arvon nimen ja yksikön
2. käytetyn kaavan
3. kaavan käyttämät soluarvot
4. lasketun välituloksen tai lopputuloksen

Esimerkki:

| Selite | Kaava | Tulos |
|---|---|---:|
| Polttoaineen kulutus vuodessa | A1 × A2 / 100 | 2 720 l |
| Polttoainekulut vuodessa | A3 × A4 | 5 997,60 € |
| Kuukausittainen polttoainekulu | A5 / 12 | 499,80 € |

Näytettävä kaava ja varsinainen laskenta käyttävät samaa laskentamallia. Kaavaa ei ylläpidetä erillisenä tekstinä, joka voisi poiketa todellisesta laskennasta.

## 7. Yhteenveto

Yhteenvetonäkymä näyttää vähintään:

- nykyisen auton vuosikustannukset
- uuden auton vuosikustannukset
- energia- ja kokonaiskäyttökustannusten säästöt
- kuukausittaisen säästön
- lyhennyksiin käytettävän osuuden
- rahoitettavan summan
- arvioidun kuukausierän
- enimmäishankintahinnan valitulla takaisinmaksuajalla

Käyttäjä voi palata mihin tahansa vaiheeseen muuttamaan arvoja. Kaikki riippuvat tulokset lasketaan uudelleen.

## 8. Laskentaperiaatteet ja testaus

Laskentapaketti on puhdasta TypeScriptiä ilman käyttöliittymä-, verkko- tai tallennusriippuvuuksia.

- samat syötteet tuottavat aina samat tulokset
- laskenta tehdään riittävällä sisäisellä tarkkuudella
- pyöristys tehdään vasta esitysvaiheessa
- puuttuva arvo ei muutu automaattisesti nollaksi
- yksiköt ja syöttöarvojen kelvollisuus tarkistetaan
- kaavojen riippuvuudet ratkaistaan deterministisesti

Testataan ainakin:

- polttomoottoriauton, hybridin, ladattavan hybridin ja sähköauton kustannuslaskenta
- energia- ja kokonaiskustannusten säästöt
- säästöosuudet
- nollakorkoinen ja korollinen rahoitus
- enimmäishankintahinta ja hankinnan kulut
- kaavojen laskujärjestys ja sulut
- soluviittaukset ja riippuvuuksien uudelleenlaskenta
- kehämäiset viittaukset
- virheelliset kaavat, tuntemattomat solut ja jakaminen nollalla

## 9. PIN-tunnisteella toimiva JSON-tallennus

PIN-koodi on laskelman yksilöivä tunniste, ei salasana eikä käyttäjän tunnistamiseen tarkoitettu turvamekanismi.

- PIN on 6–8 numeroa pitkä.
- PIN käsitellään merkkijonona, jotta etunollat säilyvät.
- Käyttäjä voi avata laskelman PIN-koodilla.
- Käyttäjä voi tallentaa laskelman PIN-koodilla.
- Jos samalla PINillä on jo tallennettu laskelma, sovellus pyytää vahvistuksen ennen tietojen korvaamista.
- Käyttäjä voi tyhjentää kyseisen laskelman tiedot erillisellä tyhjennystoiminnolla.
- Tyhjennettäessä PIN-tunniste säilyy ja samalla tunnisteella voi tallentaa myöhemmin uuden laskelman.
- Tyhjennetty tunniste ei sisällä laskelman lähtöarvoja.

Ei käyttäjätilejä, salasanoja, kirjautumisistuntoja tai monimutkaista tietojenhallintaa.

Kaikki laskelmat tallennetaan yhteen JSON-tiedostoon. Esimerkki:

```json
{
  "version": 1,
  "calculations": {
    "482731": {
      "name": "Nykyinen auto ja sähköauto",
      "data": {},
      "createdAt": "2026-11-06T12:00:00Z",
      "updatedAt": "2026-11-06T12:00:00Z"
    },
    "7381924": {
      "name": "",
      "data": null,
      "createdAt": "2026-11-06T13:00:00Z",
      "updatedAt": "2026-11-06T14:00:00Z"
    }
  }
}
```

JSON-tiedostoa ei tarjoilla suoraan julkisena staattisena tiedostona. Backend validoi PINin muodon, lukee ja kirjoittaa tiedoston sekä tekee kirjoituksen atomisesti, jotta keskeytynyt tallennus ei riko koko tiedostoa. PINin pituus ja muoto tarkistetaan, mutta sitä ei käsitellä salasanana.

## 10. API:n alustava rajaus

- `GET /api/v1/calculations/:pin` – avaa laskelman PIN-tunnisteella
- `PUT /api/v1/calculations/:pin` – tallenna tai korvaa laskelma
- `DELETE /api/v1/calculations/:pin/data` – tyhjennä laskelman sisältö mutta säilytä PIN-tunniste

Poistopäätepiste poistaa vain laskelman tiedot; se ei poista tunnistetta. API validoi pyynnöt ja palauttaa selkeät virheet, jos PIN on virheellinen tai laskelmaa ei löydy.

## 11. MVP:n rajaus

Ensimmäiseen versioon kuuluvat:

- vaiheittainen auton kustannuslaskenta
- polttomoottorin, hybridin, ladattavan hybridin ja sähköauton vertailu
- säästö- ja takaisinmaksulaskenta
- enimmäishankintahinnan laskenta
- näkyvät ja muokattavat oletusarvot
- kaavojen ja välitulosten näyttäminen
- yksinkertainen Excel-tyylinen kaavamoottori
- PIN-tunnisteella toimiva JSON-tallennus

Automaattiset ajoneuvotietojen haut, rekisteritietojen integraatiot, laajat Excel-ominaisuudet ja käyttäjähallinta jätetään myöhempään kehitykseen.
