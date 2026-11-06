# Autolaskin – ajoneuvon soveltuvuus ja huolto-/korjausriskit

Tämä dokumentti täydentää `docs/plan.md`-tiedostoa. Se kuvaa myöhempää ominaisuutta, jolla Autolaskin arvioi auton soveltuvuutta käyttäjän käytännön tarpeisiin sekä ennakoi huoltoja ja mahdollisia suurempia korjauksia suunnitellulla omistusajalla.

Tämä on suunnitteluasiakirja, ei vielä lupaus tietokannan kattavuudesta tai korjausten varmuudesta.

## 1. Tavoite

Pelkkä energiankulutus ja rahoituslaskelma eivät riitä auton valintaan. Sovelluksen pitää pystyä vastaamaan myös kahteen kysymykseen:

1. Soveltuuko kyseinen automalli käyttäjän todelliseen käyttöön ja käytännön rajoitteisiin?
2. Millaisia määräaikaishuoltoja, kuluvien osien vaihtoja ja tunnettuja suurempia korjaustarpeita voi tulla vastaan valitulla ajomäärällä ja takaisinmaksuajalla?

Tulokset yhdistetään auton kokonaiskustannusvertailuun. Käyttäjän pitää nähdä, mitkä tiedot ovat valmistajan ilmoittamia, mitkä lähteisiin perustuvia arvioita ja mitkä sovelluksen omia oletuksia.

## 2. Käyttäjän ajoprofiili ja auton valintakriteerit

Lisätään laskelmaan erillinen **Käyttötarve ja valintakriteerit** -osio. Kriteerit ovat laskelmakohtaisia, muokattavia ja tallentuvat nykyisen PIN-tallennuksen mukana.

### 2.1 Ajoprofiili

Vähintään seuraavat tiedot:

- vuosittainen ajomäärä (km/v)
- tyypillinen päivittäinen tai työmatkan ajomatka (km)
- ajojaksojen luonne: lyhyet matkat, maantie, moottoritie ja kaupunkiajo
- pitkien matkojen ja yhtäjaksoisten ajosuoritteiden yleisyys
- vuodenaikojen ja talviajon merkitys
- latausmahdollisuudet: kotona, työpaikalla ja julkisissa latauspisteissä
- suunniteltu omistusaika ja takaisinmaksuaika
- auton nykyinen ja arvioitu hankintahetken kilometrimäärä

Ajoprofiilin tulee tukea sekä yksittäistä vuosikilometrilukua että tarvittaessa kuukausi- tai kausikohtaista ajoa. Ensimmäisessä toteutuksessa riittää vuosikilometrimäärä ja muutama ajotapaluokka.

### 2.2 Käytännön soveltuvuuskriteerit

Kriteerien pitää olla yleiskäyttöisiä, jotta niitä voi käyttää myös muissa kuin sähköautoissa. Esimerkkejä:

- matkustajien määrä
- lastenistuimien määrä ja tyyppi
- takaistuimen tila ja mahdollisuus asentaa istuimet samanaikaisesti
- kuljettajan pituus ja istuma-asennon vaatima tila
- tavaratilan vähimmäistarve
- vetokyky ja vetokoukun tarve
- auton korimalli ja ovien käytännöllisyys
- maavara ja talvikäytön vaatimukset
- hankintahinnan yläraja
- vähimmäistakuu tai akkutakuun jäljellä oleva aika/kilometrimäärä
- muut käyttäjän itse määrittelemät kriteerit

Kriteerille voidaan määrittää:
- arvo tai vaatimus
- tärkeys: ehdoton, tärkeä tai toivottu
- täyttymisen tila: täyttyy, ei täyty tai ei tiedossa
- lähde ja mahdollinen huomautus

Esimerkiksi lastenistuimien mahtuminen ei saa jäädä pelkäksi auton ulkomittojen perusteella tehdyksi arvaukseksi. Jos tietoa ei ole luotettavasti saatavilla, sovellus merkitsee asian tarkistettavaksi koeajossa tai mittaamalla.

### 2.3 Sähköauton toimintamatka

Toimintamatkasta näytetään erikseen:

- valmistajan WLTP-toimintamatka
- akun ilmoitettu bruttokapasiteetti ja käytettävissä oleva nettokapasiteetti, jos tiedossa
- käyttäjän ajoprofiiliin perustuva arvioitu käytännön kulutus
- arvioitu toimintamatka kesäolosuhteissa
- arvioitu toimintamatka talviolosuhteissa
- arvioitu toimintamatka käyttäjän tyypillisellä ajosuoritteella

WLTP-lukemaa ei esitetä talvitoimintamatkana. Talviarvio lasketaan näkyvillä, muokattavilla oletuksilla. Oletuksiin vaikuttavat esimerkiksi kulutuslisä, nopeus, lämpötila, lämmitys ja akun käyttökelpoinen kapasiteetti. Sovellus ei saa väittää yksittäistä talvikantamaa varmaksi ilman ajoneuvo- ja olosuhdekohtaista lähdettä.

Käyttäjä voi asettaa vähimmäistoimintamatkan esimerkiksi tavallisen työmatkan tai muun pitkän ajosuoritteen perusteella. Lisäksi voidaan näyttää, kuinka suuri osa akun kapasiteetista kyseisellä matkalla kuluu.

## 3. Automallien perusluettelo

Backendissä ylläpidetään erillistä automallien tietokantaa. Tavoitteena on aloittaa Suomessa yleisistä täyssähköautomalleista ja laajentaa myöhemmin muihin käyttövoimiin.

### 3.1 Mallivalikoiman muodostaminen

Ensimmäiseen tietosisältöön valitaan esimerkiksi 5–10 yleistä sähköautomallia kustakin merkittävästä Suomessa myydystä automerkistä. Mallien valinta perustuu ensisijaisesti Suomessa myytyihin tai rekisteröityihin autoihin, ei maailmanlaajuiseen suosioon.

Valikoima ei ole pysyvä kovakoodattu lista. Sitä päivitetään lähteiden ja markkinatietojen perusteella. Mallikohtaiset versiot erotellaan silloin, kun niillä on olennaisia eroja esimerkiksi akun, moottorin, vetotavan, lataustehon tai huolto-ohjelman osalta.

### 3.2 Tietomalli

Automallin ja version perustietoja:

- valmistaja
- mallinimi ja mallisukupolvi
- mallivuodet
- korimalli
- käyttövoima
- akun koko (brutto/netto), jos sähköauto
- WLTP-toimintamatka ja mittaustiedon versio
- moottori- ja vetotapaversio
- latausominaisuudet
- takuutiedot
- huolto-ohjelmaan liittyvä lähde
- tietojen lähde, päiväys ja luotettavuusluokka

Yksi mallinimi ei riitä, jos eri vuosimallien tai voimalinjojen huolto- ja korjausriskit poikkeavat toisistaan.

## 4. Huoltojen ja korjausten tietokanta

Tietokannan on erotettava toisistaan kolme tietolajia. Niitä ei saa sekoittaa keskenään.

### 4.1 Valmistajan määräaikaishuollot

Tiedot haetaan ensisijaisesti valmistajan huolto-ohjelmista, käyttöohjekirjoista ja huolto-ohjeista.

Esimerkkejä:
- määräaikaishuollon aikaväli kuukausina tai kilometreinä
- jarrunesteen vaihto
- raitisilmasuodatin
- jäähdytysnesteen tarkastus tai vaihto
- voimansiirron tai alennusvaihteen öljyt, jos valmistaja niitä edellyttää
- ilmastointijärjestelmän huolto
- muut mallikohtaiset tarkastukset ja vaihdot

Jokaisesta toimenpiteestä tallennetaan aikaväli, mahdollinen kilometriraja, mahdollinen aikaraja, lähde ja tieto siitä, onko toimenpide pakollinen vai olosuhteista riippuva.

### 4.2 Kuluvat osat ja ikääntymiseen liittyvät työt

Erillinen tietolaji kattaa työt, joita ei välttämättä ole merkitty tavalliseen huolto-ohjelmaan mutta jotka voivat tulla vastaan auton iän, kilometrien tai käyttöolosuhteiden vuoksi.

Esimerkkejä:
- jarrupalat ja -levyt
- renkaat
- alustan nivelet ja puslat
- iskunvaimentimet
- laakerit
- ilmastoinnin osat
- 12 voltin akku
- lämmitys- ja jäähdytysjärjestelmän osat

Näille voidaan tallentaa tyypillinen vaihtoväli tai kilometrialue, mutta vaihtotarvetta ei saa esittää varmana. Sähköautojen vähäisempi jarrujen käyttö ja toisaalta suuri massa sekä ajotapa voivat vaikuttaa kulumiseen.

### 4.3 Tunnetut viat ja suuremmat korjaukset

Kolmas tietolaji sisältää malliin tai voimalinjaan liittyviä tunnettuja vikoja ja korjauksia.

Esimerkkejä voivat olla:
- lämpöpumppu tai ilmastointikompressori
- latauslaite ja latausliitin
- korkeajänniteakun tai sen hallintajärjestelmän viat
- invertteri ja sähkömoottori
- alustan tai ohjauksen tyyppiviat
- jäähdytysjärjestelmä
- ohjelmistoon tai elektroniikkaan liittyvät viat

Pelkkä keskustelupalstalla mainittu yksittäinen vika ei todista, että vika olisi yleinen. Tietueessa on siksi erotettava:
- vahvistettu valmistajan huoltotiedote tai takaisinkutsu
- useasta riippumattomasta lähteestä havaittu toistuva ongelma
- yksittäinen käyttäjäraportti
- sovelluksen oma karkea arvio

Jos luotettavaa vikatiheyttä ei tunneta, sovellus ei laske sille keksittyä prosenttitodennäköisyyttä.

## 5. Korjausten ajoituksen ennustaminen

Ennuste perustuu auton nykyiseen kilometrimäärään, ikään, käyttäjän vuosikilometreihin ja suunniteltuun omistusaikaan.

Jokaiselle huolto- tai korjaustietueelle voidaan määritellä:
- kilometriväli tai kilometrialue
- aikaväli tai ikä
- viimeisimmän huollon/vaihdon ajankohta tai kilometrimäärä, jos tiedossa
- arvioitu kustannus tai kustannusväli
- työn vakavuus ja vaikutus ajokelpoisuuteen
- tiedon luotettavuus
- lähde ja lähteen päiväys

Sovellus laskee, milloin toimenpide voi tulla ajankohtaiseksi sekä kilometreissä että ajassa. Jos huolto tehdään esimerkiksi 60 000 km välein, laskenta huomioi viimeksi tehdyn huollon eikä oleta, että kaikki aiemmat työt olisivat tekemättä.

Ennustejakso ulottuu valitun takaisinmaksu- tai omistusajan loppuun. Näytetään vähintään:
- toimenpiteet, jotka osuvat ennustejaksolle
- arvioitu ajankohta ja kilometrimäärä
- kustannusarvio tai kustannusväli
- toimenpiteen luonne
- lähteen luotettavuus ja puuttuvat tiedot

Käyttäjä voi merkitä huollon tai korjauksen tehdyksi ja antaa toteutuneen kilometrimäärän sekä kustannuksen. Tämä tieto tallentuu kyseiseen laskelmaan, ei automaattisesti yleiseen mallikohtaiseen tietokantaan.

## 6. Vaikutus auton kokonaiskustannuksiin

Ennakoidut huollot ja korjaukset yhdistetään kustannuslaskelmaan niin, ettei samaa kustannusta lasketa kahteen kertaan.

Näytetään erikseen:
1. valmistajan huolto-ohjelman mukaiset huollot
2. kuluvien osien arvioidut kustannukset
3. tunnettuja vikoja koskevat riskit ja mahdolliset kustannukset
4. käyttäjän itse syöttämät tai toteutuneet kustannukset

Epävarmoista korjauksista esitetään skenaariot, esimerkiksi:
- perusarvio: vain huolto-ohjelman mukaiset ja kohtuudella ennakoitavat työt
- varovainen arvio: lisäksi kuluvien osien todennäköiset kustannusvälit
- riskiskenaario: erikseen nimetty suurempi mahdollinen korjaus

Riskiskenaariota ei saa esittää odotusarvona, jos vikojen esiintymistodennäköisyyttä ei tunneta. Käyttäjä voi valita, sisällytetäänkö nämä arviot takaisinmaksulaskelmaan vai näytetäänkö ne vain huomautuksina.

Erityisen tärkeää on varoittaa, jos ennustejaksolle osuu kallis huolto tai mahdollinen korjaus, joka voi olennaisesti muuttaa auton taloudellista kannattavuutta.

## 7. Käytettyjen autojen ilmoitusten tuonti URL-osoitteella

Käyttöliittymään voidaan myöhemmässä vaiheessa lisätä toiminto, johon käyttäjä liittää käytetyn auton myynti-ilmoituksen URL-osoitteen.

Tavoiteltu työnkulku:

1. Käyttäjä liittää ilmoituksen URL-osoitteen.
2. Backend tunnistaa tuetun sivuston ja valitsee sille sopivan lähdeadapterin.
3. Adapteri hakee sallitut julkiset tiedot, jos sivuston ehdot ja tekniset rajoitukset sen sallivat.
4. Sovellus poimii mahdollisuuksien mukaan merkin, mallin, vuosimallin, version, hinnan, kilometrimäärän, akun tiedot ja ilmoituksen kuvauksen.
5. Käyttäjä tarkistaa ja vahvistaa poimitut tiedot ennen laskelman luomista.

### 7.1 Lähdeadapterit

Yleisiä suomalaisia ajoneuvojen myyntisivustoja voidaan tukea yksi kerrallaan. Toteutuksessa ei oleteta, että kaikkien sivustojen rakenne olisi samanlainen tai pysyvä.

- Käytetään sivustokohtaisia adaptereita.
- Noudatetaan sivuston käyttöehtoja, robots-ohjeita, pyyntömäärärajoituksia ja soveltuvaa lainsäädäntöä.
- Ei kierretä kirjautumista, maksumuureja, CAPTCHAa tai teknisiä pääsynestoja.
- Jos automaattinen haku ei ole sallittu tai teknisesti vakaa, tarjotaan manuaalinen syöttö tai käyttäjän kopioimien tietojen tuonti.
- URL-osoitteet validoidaan ja rajataan sallittuihin verkkotunnuksiin. Backendin SSRF-riskit estetään: ei pääsyä paikallisverkkoon, loopback-osoitteisiin tai mielivaltaisiin sisäisiin osoitteisiin.
- Haettu sisältö käsitellään epäluotettavana datana, ei suoritettavana ohjeena.
- Tallennetaan lähde-URL ja hakupäivä. Ilmoituksen hinta ja saatavuus voivat muuttua tai ilmoitus poistua.

Ensimmäinen versio voi tukea vain yhtä sivustoa tai pelkkää URL:n tallentamista ja manuaalista tietojen syöttöä. Sivustotuki lisätään vasta, kun sen sallittavuus ja tekninen toteutustapa on selvitetty.

## 8. Tietojen lähteet ja ylläpito

Tietokanta ei saa perustua yhteen lähdetyyppiin. Lähteiden ensisijaisuus:

1. valmistajan viralliset huolto-ohjelmat, käyttöohjeet, tekniset tiedotteet ja takaisinkutsut
2. viranomaislähteet ja viralliset ajoneuvotilastot
3. riippumattomat korjaamot ja tekniset julkaisut
4. luotettavat autoalan julkaisut ja katsaukset
5. käyttäjäraportit ja keskustelupalstat, selvästi alemmalla luotettavuusluokalla

Jokainen tieto sisältää lähdeviitteen, tiedon keruupäivän, soveltuvan malliversion ja luotettavuusluokan. Lähteiden käyttöoikeudet tarkistetaan ennen tietojen tallentamista tai laajamittaista keräämistä. Tekijänoikeudella suojattuja huoltokirjoja ei kopioida kokonaisuudessaan tietokantaan; tallennetaan tarvittavat rakenteiset tiedot ja lähdeviitteet vain käyttöoikeuksien sallimassa laajuudessa.

Tietokannan ylläpito voi aluksi olla käsin tehtävä, versionhallittu prosessi. Automaattinen päivitys lisätään vasta, kun lähteet ja niiden käyttöehdot tunnetaan.

## 9. Ehdotettu backend-rakenne

MVP:n nykyinen yhden JSON-tiedoston laskelmatallennus voidaan pitää erillään yleisestä automallitietokannasta.

Ehdotettu rakenne:

- `data/vehicle-catalog.json` – merkit, mallit, malliversiot ja tekniset perustiedot
- `data/maintenance-data.json` – huolto-ohjelmat, kuluvat osat, tunnetut viat ja kustannusarviot
- `data/source-registry.json` – lähteet, URL-osoitteet, päiväykset ja luotettavuusluokat
- laskelmakohtainen JSON-data – käyttäjän ajoprofiili, valintakriteerit, valittu auto, huoltohistoria ja tehdyt muutokset

Tiedostot validoidaan skeemalla. Yleisen tietokannan versio ja laskelman käyttämä tietokantaversio tallennetaan, jotta vanha laskelma voidaan tarvittaessa laskea uudelleen samoilla lähtötiedoilla.

Jos tietosisältö kasvaa tai samanaikaiset päivitykset lisääntyvät, voidaan siirtyä tietokantaan. Sitä ei tarvitse tehdä tämän ominaisuuden ensimmäisessä vaiheessa.

## 10. Käyttöliittymän ehdotettu työnkulku

1. **Käyttötarve:** käyttäjä määrittää ajomäärän, matkarytmin, latausmahdollisuudet ja omistusajan.
2. **Valintakriteerit:** käyttäjä määrittää ehdottomat ja toivotut ominaisuudet.
3. **Automalli:** käyttäjä valitsee merkin, mallin ja version tai tuo ilmoituksen URL-osoitteella.
4. **Soveltuvuus:** sovellus vertaa mallin tietoja käyttäjän kriteereihin ja näyttää myös puuttuvat tiedot.
5. **Huoltoennuste:** sovellus näyttää ennustejaksolle osuvat huollot, kuluvat osat ja mahdolliset tunnetut riskit.
6. **Kustannuslaskelma:** ennusteet siirtyvät näkyvinä riveinä auton kustannuksiin ja takaisinmaksulaskelmaan.

Soveltuvuuspisteitä voidaan käyttää lajittelun apuna, mutta ehdottomien kriteerien alitusta ei saa peittää hyvällä kokonaispistemäärällä. Käyttäjä näkee aina, miksi auto saa tietyn arvion.

## 11. Toteutusvaiheet

### Vaihe A – valintakriteerit ja ajoprofiili
- Lisää laskelmakohtainen ajoprofiili.
- Lisää muokattavat, painotetut valintakriteerit.
- Näytä WLTP- ja talvitoimintamatka erillisinä arvoina.
- Lisää soveltuvuuden tarkistus ilman automaattista verkkohakua.

### Vaihe B – rajattu automallien tietokanta
- Määrittele tietomallit ja validointi.
- Lisää aluksi rajattu joukko Suomessa yleisiä sähköautomalleja.
- Lisää malliversioiden erot ja lähdeviitteet.
- Mahdollista tietojen täydentäminen käsin.

### Vaihe C – huolto-ohjelmat ja ennuste
- Lisää valmistajan huolto-ohjelmien rakenteiset tiedot.
- Laske huoltojen ajankohdat kilometrien ja ajan perusteella.
- Lisää kuluvien osien kustannusarviot erillisinä tietoina.
- Näytä ennustejakson kustannukset ja epävarmuus.

### Vaihe D – tunnetut viat ja riskiskenaariot
- Lisää lähteistetty mallikohtainen vikadata.
- Erota vahvistetut tiedotteet, toistuvat havainnot ja yksittäiset raportit.
- Lisää varovainen ja riskiskenaario.
- Älä esitä tuntematonta vikatiheyttä numeerisena todennäköisyytenä.

### Vaihe E – ilmoituslinkkien tuonti
- Selvitä ensin tuettavien suomalaisten myyntisivustojen käyttöehdot ja sallitut rajapinnat.
- Toteuta ensimmäinen sallittu lähdeadapteri.
- Lisää poimittujen tietojen käyttäjän vahvistus.
- Lisää muut sivustot yksi kerrallaan.

## 12. Testattavat tapaukset

- vuosikilometrien ja omistusajan muuttaminen siirtää huoltoennusteita oikein
- aika- ja kilometriperusteinen huoltoraja huomioidaan oikein
- viimeksi tehty huolto siirtää seuraavan huollon ajankohtaa
- eri mallivuodet ja voimalinjaversiot eivät sekoitu
- puuttuva lähdetieto näkyy tuntemattomana, ei nollana
- WLTP-arvoa ei esitetä talvitoimintamatkana
- ehdoton valintakriteeri ei muutu hyväksytyksi kokonaispisteiden perusteella
- samaa korjauskustannusta ei lasketa kahteen kertaan
- epävarma vikahavainto ei muutu virheelliseksi varmaksi ennusteeksi
- ilmoituslinkin haku torjuu kielletyt verkkotunnukset ja sisäverkko-osoitteet
- ilmoituksesta poimitut tiedot eivät siirry laskelmaan ilman käyttäjän vahvistusta

## 13. Rajaukset ja periaatteet

- Huoltokirja kertoo ensisijaisesti suunnitelluista huolloista, ei kaikkien vikojen esiintymistodennäköisyyttä.
- Huolto-ohjelma, kuluvien osien arvio ja tunnettu vikariski pidetään erillisinä.
- Ennuste on päätöksenteon tuki, ei lupaus siitä, että tietty korjaus varmasti tehdään tai jää tekemättä.
- Auton kunto, käyttöolosuhteet, huoltohistoria ja yksilökohtaiset erot voivat muuttaa ennustetta olennaisesti.
- Käyttäjän omat kriteerit ja tiedot säilyvät ensisijaisina. Sovelluksen yleiset oletukset eivät saa hiljaisesti korvata niitä.
