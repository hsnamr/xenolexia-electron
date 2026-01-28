/**
 * English-Greek Word List
 *
 * Frequency-ranked word translations for the Xenolexia app.
 * Words are organized by proficiency level based on frequency rank:
 * - Beginner (A1-A2): Ranks 1-500 (most common words)
 * - Intermediate (B1-B2): Ranks 501-2000
 * - Advanced (C1-C2): Ranks 2001+
 */

import type { PartOfSpeech } from '@/types';

export interface WordData {
  source: string;
  target: string;
  rank: number;
  pos: PartOfSpeech;
  variants?: string[];
  pronunciation?: string;
}

// ============================================================================
// Beginner Words (A1-A2) - Most Common 500 Words
// ============================================================================

export const BEGINNER_WORDS: WordData[] = [
  // === BASIC NOUNS (Ranks 1-100) ===
  { source: 'time', target: 'χρόνος', rank: 1, pos: 'noun', pronunciation: 'chronos' },
  { source: 'year', target: 'χρόνος', rank: 2, pos: 'noun', variants: ['years'], pronunciation: 'chronos' },
  { source: 'people', target: 'άνθρωποι', rank: 3, pos: 'noun', pronunciation: 'anthropoi' },
  { source: 'way', target: 'τρόπος', rank: 4, pos: 'noun', variants: ['ways'], pronunciation: 'tropos' },
  { source: 'day', target: 'ημέρα', rank: 5, pos: 'noun', variants: ['days'], pronunciation: 'imera' },
  { source: 'man', target: 'άνδρας', rank: 6, pos: 'noun', variants: ['men'], pronunciation: 'andras' },
  { source: 'woman', target: 'γυναίκα', rank: 7, pos: 'noun', variants: ['women'], pronunciation: 'gynaika' },
  { source: 'child', target: 'παιδί', rank: 8, pos: 'noun', variants: ['children'], pronunciation: 'pedi' },
  { source: 'world', target: 'κόσμος', rank: 9, pos: 'noun', pronunciation: 'kosmos' },
  { source: 'life', target: 'ζωή', rank: 10, pos: 'noun', variants: ['lives'], pronunciation: 'zoi' },
  { source: 'hand', target: 'χέρι', rank: 11, pos: 'noun', variants: ['hands'], pronunciation: 'heri' },
  { source: 'part', target: 'μέρος', rank: 12, pos: 'noun', variants: ['parts'], pronunciation: 'meros' },
  { source: 'place', target: 'μέρος', rank: 13, pos: 'noun', variants: ['places'], pronunciation: 'meros' },
  { source: 'case', target: 'περίπτωση', rank: 14, pos: 'noun', variants: ['cases'], pronunciation: 'periptosi' },
  { source: 'week', target: 'εβδομάδα', rank: 15, pos: 'noun', variants: ['weeks'], pronunciation: 'evdomada' },
  { source: 'company', target: 'εταιρεία', rank: 16, pos: 'noun', variants: ['companies'], pronunciation: 'eteria' },
  { source: 'system', target: 'σύστημα', rank: 17, pos: 'noun', variants: ['systems'], pronunciation: 'systima' },
  { source: 'program', target: 'πρόγραμμα', rank: 18, pos: 'noun', variants: ['programs'], pronunciation: 'programma' },
  { source: 'question', target: 'ερώτηση', rank: 19, pos: 'noun', variants: ['questions'], pronunciation: 'erotisi' },
  { source: 'work', target: 'δουλειά', rank: 20, pos: 'noun', pronunciation: 'doulia' },
  { source: 'government', target: 'κυβέρνηση', rank: 21, pos: 'noun', pronunciation: 'kyvernisi' },
  { source: 'number', target: 'αριθμός', rank: 22, pos: 'noun', variants: ['numbers'], pronunciation: 'arithmos' },
  { source: 'night', target: 'νύχτα', rank: 23, pos: 'noun', variants: ['nights'], pronunciation: 'nychta' },
  { source: 'point', target: 'σημείο', rank: 24, pos: 'noun', variants: ['points'], pronunciation: 'simio' },
  { source: 'home', target: 'σπίτι', rank: 25, pos: 'noun', variants: ['homes'], pronunciation: 'spiti' },
  { source: 'water', target: 'νερό', rank: 26, pos: 'noun', pronunciation: 'nero' },
  { source: 'room', target: 'δωμάτιο', rank: 27, pos: 'noun', variants: ['rooms'], pronunciation: 'domatio' },
  { source: 'mother', target: 'μητέρα', rank: 28, pos: 'noun', variants: ['mothers'], pronunciation: 'mitera' },
  { source: 'area', target: 'περιοχή', rank: 29, pos: 'noun', variants: ['areas'], pronunciation: 'periochi' },
  { source: 'money', target: 'χρήματα', rank: 30, pos: 'noun', pronunciation: 'chrimata' },
  { source: 'story', target: 'ιστορία', rank: 31, pos: 'noun', variants: ['stories'], pronunciation: 'istoria' },
  { source: 'fact', target: 'γεγονός', rank: 32, pos: 'noun', variants: ['facts'], pronunciation: 'gegonos' },
  { source: 'month', target: 'μήνας', rank: 33, pos: 'noun', variants: ['months'], pronunciation: 'minas' },
  { source: 'lot', target: 'πολλά', rank: 34, pos: 'noun', pronunciation: 'polla' },
  { source: 'right', target: 'δικαίωμα', rank: 35, pos: 'noun', variants: ['rights'], pronunciation: 'dikeoma' },
  { source: 'study', target: 'μελέτη', rank: 36, pos: 'noun', variants: ['studies'], pronunciation: 'meleti' },
  { source: 'book', target: 'βιβλίο', rank: 37, pos: 'noun', variants: ['books'], pronunciation: 'vivlio' },
  { source: 'eye', target: 'μάτι', rank: 38, pos: 'noun', variants: ['eyes'], pronunciation: 'mati' },
  { source: 'job', target: 'δουλειά', rank: 39, pos: 'noun', variants: ['jobs'], pronunciation: 'doulia' },
  { source: 'word', target: 'λέξη', rank: 40, pos: 'noun', variants: ['words'], pronunciation: 'lexi' },
  { source: 'business', target: 'επιχείρηση', rank: 41, pos: 'noun', pronunciation: 'epichirisi' },
  { source: 'issue', target: 'ζήτημα', rank: 42, pos: 'noun', variants: ['issues'], pronunciation: 'zitima' },
  { source: 'side', target: 'πλευρά', rank: 43, pos: 'noun', variants: ['sides'], pronunciation: 'plevra' },
  { source: 'kind', target: 'είδος', rank: 44, pos: 'noun', variants: ['kinds'], pronunciation: 'eidos' },
  { source: 'head', target: 'κεφάλι', rank: 45, pos: 'noun', variants: ['heads'], pronunciation: 'kefali' },
  { source: 'house', target: 'σπίτι', rank: 46, pos: 'noun', variants: ['houses'], pronunciation: 'spiti' },
  { source: 'service', target: 'υπηρεσία', rank: 47, pos: 'noun', variants: ['services'], pronunciation: 'ypiresia' },
  { source: 'friend', target: 'φίλος', rank: 48, pos: 'noun', variants: ['friends'], pronunciation: 'filos' },
  { source: 'father', target: 'πατέρας', rank: 49, pos: 'noun', variants: ['fathers'], pronunciation: 'pateras' },
  { source: 'power', target: 'δύναμη', rank: 50, pos: 'noun', pronunciation: 'dynami' },

  // === COMMON VERBS (Ranks 51-150) ===
  { source: 'be', target: 'είμαι', rank: 51, pos: 'verb', variants: ['is', 'are', 'was', 'were', 'been', 'being'], pronunciation: 'ime' },
  { source: 'have', target: 'έχω', rank: 52, pos: 'verb', variants: ['has', 'had', 'having'], pronunciation: 'echo' },
  { source: 'do', target: 'κάνω', rank: 53, pos: 'verb', variants: ['does', 'did', 'done', 'doing'], pronunciation: 'kano' },
  { source: 'say', target: 'λέω', rank: 54, pos: 'verb', variants: ['says', 'said', 'saying'], pronunciation: 'leo' },
  { source: 'get', target: 'παίρνω', rank: 55, pos: 'verb', variants: ['gets', 'got', 'getting', 'gotten'], pronunciation: 'perno' },
  { source: 'make', target: 'φτιάχνω', rank: 56, pos: 'verb', variants: ['makes', 'made', 'making'], pronunciation: 'ftiachno' },
  { source: 'go', target: 'πηγαίνω', rank: 57, pos: 'verb', variants: ['goes', 'went', 'gone', 'going'], pronunciation: 'pigeno' },
  { source: 'know', target: 'ξέρω', rank: 58, pos: 'verb', variants: ['knows', 'knew', 'known', 'knowing'], pronunciation: 'xero' },
  { source: 'take', target: 'παίρνω', rank: 59, pos: 'verb', variants: ['takes', 'took', 'taken', 'taking'], pronunciation: 'perno' },
  { source: 'see', target: 'βλέπω', rank: 60, pos: 'verb', variants: ['sees', 'saw', 'seen', 'seeing'], pronunciation: 'vlepo' },
  { source: 'come', target: 'έρχομαι', rank: 61, pos: 'verb', variants: ['comes', 'came', 'coming'], pronunciation: 'erchome' },
  { source: 'think', target: 'σκέφτομαι', rank: 62, pos: 'verb', variants: ['thinks', 'thought', 'thinking'], pronunciation: 'skeftome' },
  { source: 'look', target: 'κοιτάζω', rank: 63, pos: 'verb', variants: ['looks', 'looked', 'looking'], pronunciation: 'kitazo' },
  { source: 'want', target: 'θέλω', rank: 64, pos: 'verb', variants: ['wants', 'wanted', 'wanting'], pronunciation: 'thelo' },
  { source: 'give', target: 'δίνω', rank: 65, pos: 'verb', variants: ['gives', 'gave', 'given', 'giving'], pronunciation: 'dino' },
  { source: 'use', target: 'χρησιμοποιώ', rank: 66, pos: 'verb', variants: ['uses', 'used', 'using'], pronunciation: 'chrisimopio' },
  { source: 'find', target: 'βρίσκω', rank: 67, pos: 'verb', variants: ['finds', 'found', 'finding'], pronunciation: 'vrisko' },
  { source: 'tell', target: 'λέω', rank: 68, pos: 'verb', variants: ['tells', 'told', 'telling'], pronunciation: 'leo' },
  { source: 'ask', target: 'ρωτάω', rank: 69, pos: 'verb', variants: ['asks', 'asked', 'asking'], pronunciation: 'rotao' },
  { source: 'work', target: 'δουλεύω', rank: 70, pos: 'verb', variants: ['works', 'worked', 'working'], pronunciation: 'doulevo' },
  { source: 'seem', target: 'φαίνομαι', rank: 71, pos: 'verb', variants: ['seems', 'seemed', 'seeming'], pronunciation: 'fenome' },
  { source: 'feel', target: 'νιώθω', rank: 72, pos: 'verb', variants: ['feels', 'felt', 'feeling'], pronunciation: 'niotho' },
  { source: 'try', target: 'προσπαθώ', rank: 73, pos: 'verb', variants: ['tries', 'tried', 'trying'], pronunciation: 'prospatho' },
  { source: 'leave', target: 'φεύγω', rank: 74, pos: 'verb', variants: ['leaves', 'left', 'leaving'], pronunciation: 'fevgo' },
  { source: 'call', target: 'καλώ', rank: 75, pos: 'verb', variants: ['calls', 'called', 'calling'], pronunciation: 'kalo' },
  { source: 'love', target: 'αγαπώ', rank: 76, pos: 'verb', variants: ['loves', 'loved', 'loving'], pronunciation: 'agapo' },
  { source: 'eat', target: 'τρώω', rank: 77, pos: 'verb', variants: ['eats', 'ate', 'eaten', 'eating'], pronunciation: 'troo' },
  { source: 'drink', target: 'πίνω', rank: 78, pos: 'verb', variants: ['drinks', 'drank', 'drunk', 'drinking'], pronunciation: 'pino' },
  { source: 'sleep', target: 'κοιμάμαι', rank: 79, pos: 'verb', variants: ['sleeps', 'slept', 'sleeping'], pronunciation: 'kimame' },
  { source: 'walk', target: 'περπατώ', rank: 80, pos: 'verb', variants: ['walks', 'walked', 'walking'], pronunciation: 'perpato' },
  { source: 'run', target: 'τρέχω', rank: 81, pos: 'verb', variants: ['runs', 'ran', 'running'], pronunciation: 'trecho' },
  { source: 'write', target: 'γράφω', rank: 82, pos: 'verb', variants: ['writes', 'wrote', 'written', 'writing'], pronunciation: 'grafo' },
  { source: 'read', target: 'διαβάζω', rank: 83, pos: 'verb', variants: ['reads', 'reading'], pronunciation: 'diavazo' },
  { source: 'speak', target: 'μιλάω', rank: 84, pos: 'verb', variants: ['speaks', 'spoke', 'spoken', 'speaking'], pronunciation: 'milao' },
  { source: 'listen', target: 'ακούω', rank: 85, pos: 'verb', variants: ['listens', 'listened', 'listening'], pronunciation: 'akouo' },
  { source: 'learn', target: 'μαθαίνω', rank: 86, pos: 'verb', variants: ['learns', 'learned', 'learning'], pronunciation: 'matheno' },
  { source: 'play', target: 'παίζω', rank: 87, pos: 'verb', variants: ['plays', 'played', 'playing'], pronunciation: 'pezo' },
  { source: 'live', target: 'ζω', rank: 88, pos: 'verb', variants: ['lives', 'lived', 'living'], pronunciation: 'zo' },
  { source: 'begin', target: 'αρχίζω', rank: 89, pos: 'verb', variants: ['begins', 'began', 'begun', 'beginning'], pronunciation: 'archizo' },
  { source: 'help', target: 'βοηθώ', rank: 90, pos: 'verb', variants: ['helps', 'helped', 'helping'], pronunciation: 'voitho' },

  // === COMMON ADJECTIVES (Ranks 91-150) ===
  { source: 'good', target: 'καλός', rank: 91, pos: 'adjective', pronunciation: 'kalos' },
  { source: 'new', target: 'νέος', rank: 92, pos: 'adjective', pronunciation: 'neos' },
  { source: 'first', target: 'πρώτος', rank: 93, pos: 'adjective', pronunciation: 'protos' },
  { source: 'last', target: 'τελευταίος', rank: 94, pos: 'adjective', pronunciation: 'telefteos' },
  { source: 'long', target: 'μακρύς', rank: 95, pos: 'adjective', pronunciation: 'makrys' },
  { source: 'great', target: 'μεγάλος', rank: 96, pos: 'adjective', pronunciation: 'megalos' },
  { source: 'little', target: 'μικρός', rank: 97, pos: 'adjective', pronunciation: 'mikros' },
  { source: 'own', target: 'δικός', rank: 98, pos: 'adjective', pronunciation: 'dikos' },
  { source: 'other', target: 'άλλος', rank: 99, pos: 'adjective', pronunciation: 'allos' },
  { source: 'old', target: 'παλιός', rank: 100, pos: 'adjective', pronunciation: 'palios' },
  { source: 'right', target: 'σωστός', rank: 101, pos: 'adjective', pronunciation: 'sostos' },
  { source: 'big', target: 'μεγάλος', rank: 102, pos: 'adjective', pronunciation: 'megalos' },
  { source: 'high', target: 'ψηλός', rank: 103, pos: 'adjective', pronunciation: 'psilos' },
  { source: 'different', target: 'διαφορετικός', rank: 104, pos: 'adjective', pronunciation: 'diaforetikos' },
  { source: 'small', target: 'μικρός', rank: 105, pos: 'adjective', pronunciation: 'mikros' },
  { source: 'large', target: 'μεγάλος', rank: 106, pos: 'adjective', pronunciation: 'megalos' },
  { source: 'next', target: 'επόμενος', rank: 107, pos: 'adjective', pronunciation: 'epomenos' },
  { source: 'early', target: 'νωρίς', rank: 108, pos: 'adjective', pronunciation: 'noris' },
  { source: 'young', target: 'νέος', rank: 109, pos: 'adjective', pronunciation: 'neos' },
  { source: 'important', target: 'σημαντικός', rank: 110, pos: 'adjective', pronunciation: 'simantikos' },
  { source: 'few', target: 'λίγοι', rank: 111, pos: 'adjective', pronunciation: 'ligi' },
  { source: 'public', target: 'δημόσιος', rank: 112, pos: 'adjective', pronunciation: 'dimosios' },
  { source: 'bad', target: 'κακός', rank: 113, pos: 'adjective', pronunciation: 'kakos' },
  { source: 'same', target: 'ίδιος', rank: 114, pos: 'adjective', pronunciation: 'idios' },
  { source: 'able', target: 'ικανός', rank: 115, pos: 'adjective', pronunciation: 'ikanos' },
  { source: 'beautiful', target: 'όμορφος', rank: 116, pos: 'adjective', pronunciation: 'omorfos' },
  { source: 'happy', target: 'χαρούμενος', rank: 117, pos: 'adjective', pronunciation: 'charoumenos' },
  { source: 'sad', target: 'λυπημένος', rank: 118, pos: 'adjective', pronunciation: 'lypimenos' },
  { source: 'hot', target: 'ζεστός', rank: 119, pos: 'adjective', pronunciation: 'zestos' },
  { source: 'cold', target: 'κρύος', rank: 120, pos: 'adjective', pronunciation: 'kryos' },

  // === MORE NOUNS (Ranks 121-200) ===
  { source: 'hour', target: 'ώρα', rank: 121, pos: 'noun', variants: ['hours'], pronunciation: 'ora' },
  { source: 'door', target: 'πόρτα', rank: 122, pos: 'noun', variants: ['doors'], pronunciation: 'porta' },
  { source: 'car', target: 'αυτοκίνητο', rank: 123, pos: 'noun', variants: ['cars'], pronunciation: 'aftokinito' },
  { source: 'city', target: 'πόλη', rank: 124, pos: 'noun', variants: ['cities'], pronunciation: 'poli' },
  { source: 'tree', target: 'δέντρο', rank: 125, pos: 'noun', variants: ['trees'], pronunciation: 'dentro' },
  { source: 'sun', target: 'ήλιος', rank: 126, pos: 'noun', pronunciation: 'ilios' },
  { source: 'moon', target: 'φεγγάρι', rank: 127, pos: 'noun', pronunciation: 'fengari' },
  { source: 'star', target: 'αστέρι', rank: 128, pos: 'noun', variants: ['stars'], pronunciation: 'asteri' },
  { source: 'sky', target: 'ουρανός', rank: 129, pos: 'noun', pronunciation: 'ouranos' },
  { source: 'sea', target: 'θάλασσα', rank: 130, pos: 'noun', pronunciation: 'thalassa' },
  { source: 'fire', target: 'φωτιά', rank: 131, pos: 'noun', pronunciation: 'fotia' },
  { source: 'earth', target: 'γη', rank: 132, pos: 'noun', pronunciation: 'gi' },
  { source: 'air', target: 'αέρας', rank: 133, pos: 'noun', pronunciation: 'aeras' },
  { source: 'food', target: 'φαγητό', rank: 134, pos: 'noun', pronunciation: 'fagito' },
  { source: 'dog', target: 'σκύλος', rank: 135, pos: 'noun', variants: ['dogs'], pronunciation: 'skylos' },
  { source: 'cat', target: 'γάτα', rank: 136, pos: 'noun', variants: ['cats'], pronunciation: 'gata' },
  { source: 'bird', target: 'πουλί', rank: 137, pos: 'noun', variants: ['birds'], pronunciation: 'pouli' },
  { source: 'fish', target: 'ψάρι', rank: 138, pos: 'noun', variants: ['fish', 'fishes'], pronunciation: 'psari' },
  { source: 'flower', target: 'λουλούδι', rank: 139, pos: 'noun', variants: ['flowers'], pronunciation: 'louloudi' },
  { source: 'table', target: 'τραπέζι', rank: 140, pos: 'noun', variants: ['tables'], pronunciation: 'trapezi' },
  { source: 'chair', target: 'καρέκλα', rank: 141, pos: 'noun', variants: ['chairs'], pronunciation: 'karekla' },
  { source: 'bed', target: 'κρεβάτι', rank: 142, pos: 'noun', variants: ['beds'], pronunciation: 'krevati' },
  { source: 'window', target: 'παράθυρο', rank: 143, pos: 'noun', variants: ['windows'], pronunciation: 'parathyro' },
  { source: 'street', target: 'δρόμος', rank: 144, pos: 'noun', variants: ['streets'], pronunciation: 'dromos' },
  { source: 'school', target: 'σχολείο', rank: 145, pos: 'noun', variants: ['schools'], pronunciation: 'scholio' },
  { source: 'teacher', target: 'δάσκαλος', rank: 146, pos: 'noun', variants: ['teachers'], pronunciation: 'daskalos' },
  { source: 'student', target: 'μαθητής', rank: 147, pos: 'noun', variants: ['students'], pronunciation: 'mathitis' },
  { source: 'doctor', target: 'γιατρός', rank: 148, pos: 'noun', variants: ['doctors'], pronunciation: 'giatros' },
  { source: 'heart', target: 'καρδιά', rank: 149, pos: 'noun', variants: ['hearts'], pronunciation: 'kardia' },
  { source: 'face', target: 'πρόσωπο', rank: 150, pos: 'noun', variants: ['faces'], pronunciation: 'prosopo' },

  // Continue with more beginner words...
  { source: 'family', target: 'οικογένεια', rank: 151, pos: 'noun', variants: ['families'], pronunciation: 'ikogenia' },
  { source: 'name', target: 'όνομα', rank: 152, pos: 'noun', variants: ['names'], pronunciation: 'onoma' },
  { source: 'morning', target: 'πρωί', rank: 153, pos: 'noun', variants: ['mornings'], pronunciation: 'proi' },
  { source: 'afternoon', target: 'απόγευμα', rank: 154, pos: 'noun', variants: ['afternoons'], pronunciation: 'apogevma' },
  { source: 'evening', target: 'βράδυ', rank: 155, pos: 'noun', variants: ['evenings'], pronunciation: 'vrady' },
  { source: 'color', target: 'χρώμα', rank: 156, pos: 'noun', variants: ['colors'], pronunciation: 'chroma' },
  { source: 'red', target: 'κόκκινος', rank: 157, pos: 'adjective', pronunciation: 'kokkinos' },
  { source: 'blue', target: 'μπλε', rank: 158, pos: 'adjective', pronunciation: 'ble' },
  { source: 'green', target: 'πράσινος', rank: 159, pos: 'adjective', pronunciation: 'prasinos' },
  { source: 'white', target: 'άσπρος', rank: 160, pos: 'adjective', pronunciation: 'aspros' },
  { source: 'black', target: 'μαύρος', rank: 161, pos: 'adjective', pronunciation: 'mavros' },
  { source: 'yellow', target: 'κίτρινος', rank: 162, pos: 'adjective', pronunciation: 'kitrinos' },
  { source: 'bread', target: 'ψωμί', rank: 163, pos: 'noun', pronunciation: 'psomi' },
  { source: 'milk', target: 'γάλα', rank: 164, pos: 'noun', pronunciation: 'gala' },
  { source: 'coffee', target: 'καφές', rank: 165, pos: 'noun', pronunciation: 'kafes' },
  { source: 'tea', target: 'τσάι', rank: 166, pos: 'noun', pronunciation: 'tsai' },
  { source: 'wine', target: 'κρασί', rank: 167, pos: 'noun', pronunciation: 'krasi' },
  { source: 'today', target: 'σήμερα', rank: 168, pos: 'adverb', pronunciation: 'simera' },
  { source: 'tomorrow', target: 'αύριο', rank: 169, pos: 'adverb', pronunciation: 'avrio' },
  { source: 'yesterday', target: 'χθες', rank: 170, pos: 'adverb', pronunciation: 'chthes' },
];

// ============================================================================
// Intermediate Words (B1-B2) - Ranks 501-2000
// ============================================================================

export const INTERMEDIATE_WORDS: WordData[] = [
  { source: 'problem', target: 'πρόβλημα', rank: 501, pos: 'noun', variants: ['problems'], pronunciation: 'provlima' },
  { source: 'decision', target: 'απόφαση', rank: 502, pos: 'noun', variants: ['decisions'], pronunciation: 'apofasi' },
  { source: 'experience', target: 'εμπειρία', rank: 503, pos: 'noun', variants: ['experiences'], pronunciation: 'empeiria' },
  { source: 'opportunity', target: 'ευκαιρία', rank: 504, pos: 'noun', variants: ['opportunities'], pronunciation: 'efkeria' },
  { source: 'relationship', target: 'σχέση', rank: 505, pos: 'noun', variants: ['relationships'], pronunciation: 'schesi' },
  { source: 'situation', target: 'κατάσταση', rank: 506, pos: 'noun', variants: ['situations'], pronunciation: 'katastasi' },
  { source: 'information', target: 'πληροφορία', rank: 507, pos: 'noun', pronunciation: 'pliroforia' },
  { source: 'development', target: 'ανάπτυξη', rank: 508, pos: 'noun', pronunciation: 'anaptyxi' },
  { source: 'community', target: 'κοινότητα', rank: 509, pos: 'noun', variants: ['communities'], pronunciation: 'kinotita' },
  { source: 'education', target: 'εκπαίδευση', rank: 510, pos: 'noun', pronunciation: 'ekpaidefsi' },
  { source: 'environment', target: 'περιβάλλον', rank: 511, pos: 'noun', pronunciation: 'perivallon' },
  { source: 'research', target: 'έρευνα', rank: 512, pos: 'noun', pronunciation: 'erevna' },
  { source: 'technology', target: 'τεχνολογία', rank: 513, pos: 'noun', pronunciation: 'technologia' },
  { source: 'economy', target: 'οικονομία', rank: 514, pos: 'noun', pronunciation: 'ikonomia' },
  { source: 'society', target: 'κοινωνία', rank: 515, pos: 'noun', pronunciation: 'kinonia' },
  { source: 'culture', target: 'πολιτισμός', rank: 516, pos: 'noun', pronunciation: 'politismos' },
  { source: 'history', target: 'ιστορία', rank: 517, pos: 'noun', pronunciation: 'istoria' },
  { source: 'science', target: 'επιστήμη', rank: 518, pos: 'noun', pronunciation: 'epistimi' },
  { source: 'nature', target: 'φύση', rank: 519, pos: 'noun', pronunciation: 'fysi' },
  { source: 'future', target: 'μέλλον', rank: 520, pos: 'noun', pronunciation: 'mellon' },
  { source: 'believe', target: 'πιστεύω', rank: 521, pos: 'verb', variants: ['believes', 'believed', 'believing'], pronunciation: 'pistevo' },
  { source: 'remember', target: 'θυμάμαι', rank: 522, pos: 'verb', variants: ['remembers', 'remembered'], pronunciation: 'thimame' },
  { source: 'understand', target: 'καταλαβαίνω', rank: 523, pos: 'verb', variants: ['understands', 'understood'], pronunciation: 'katalaveno' },
  { source: 'consider', target: 'θεωρώ', rank: 524, pos: 'verb', variants: ['considers', 'considered'], pronunciation: 'theoro' },
  { source: 'develop', target: 'αναπτύσσω', rank: 525, pos: 'verb', variants: ['develops', 'developed'], pronunciation: 'anaptyso' },
  { source: 'include', target: 'περιλαμβάνω', rank: 526, pos: 'verb', variants: ['includes', 'included'], pronunciation: 'perilamvano' },
  { source: 'continue', target: 'συνεχίζω', rank: 527, pos: 'verb', variants: ['continues', 'continued'], pronunciation: 'synechizo' },
  { source: 'provide', target: 'παρέχω', rank: 528, pos: 'verb', variants: ['provides', 'provided'], pronunciation: 'parecho' },
  { source: 'create', target: 'δημιουργώ', rank: 529, pos: 'verb', variants: ['creates', 'created'], pronunciation: 'dimiourgó' },
  { source: 'expect', target: 'περιμένω', rank: 530, pos: 'verb', variants: ['expects', 'expected'], pronunciation: 'perimeno' },
  { source: 'possible', target: 'πιθανός', rank: 531, pos: 'adjective', pronunciation: 'pithanos' },
  { source: 'necessary', target: 'απαραίτητος', rank: 532, pos: 'adjective', pronunciation: 'aparetitos' },
  { source: 'available', target: 'διαθέσιμος', rank: 533, pos: 'adjective', pronunciation: 'diathesimos' },
  { source: 'political', target: 'πολιτικός', rank: 534, pos: 'adjective', pronunciation: 'politikos' },
  { source: 'economic', target: 'οικονομικός', rank: 535, pos: 'adjective', pronunciation: 'ikonomikos' },
  { source: 'social', target: 'κοινωνικός', rank: 536, pos: 'adjective', pronunciation: 'kinonikos' },
  { source: 'international', target: 'διεθνής', rank: 537, pos: 'adjective', pronunciation: 'diethnis' },
  { source: 'national', target: 'εθνικός', rank: 538, pos: 'adjective', pronunciation: 'ethnikos' },
  { source: 'local', target: 'τοπικός', rank: 539, pos: 'adjective', pronunciation: 'topikos' },
  { source: 'special', target: 'ειδικός', rank: 540, pos: 'adjective', pronunciation: 'idikos' },
];

// ============================================================================
// Advanced Words (C1-C2) - Ranks 2001+
// ============================================================================

export const ADVANCED_WORDS: WordData[] = [
  { source: 'phenomenon', target: 'φαινόμενο', rank: 2001, pos: 'noun', variants: ['phenomena'], pronunciation: 'fenomeno' },
  { source: 'hypothesis', target: 'υπόθεση', rank: 2002, pos: 'noun', variants: ['hypotheses'], pronunciation: 'ypothesi' },
  { source: 'consequence', target: 'συνέπεια', rank: 2003, pos: 'noun', variants: ['consequences'], pronunciation: 'synepeia' },
  { source: 'perspective', target: 'προοπτική', rank: 2004, pos: 'noun', variants: ['perspectives'], pronunciation: 'prooptiki' },
  { source: 'circumstance', target: 'περίσταση', rank: 2005, pos: 'noun', variants: ['circumstances'], pronunciation: 'peristasi' },
  { source: 'implementation', target: 'υλοποίηση', rank: 2006, pos: 'noun', pronunciation: 'ylopoiisi' },
  { source: 'infrastructure', target: 'υποδομή', rank: 2007, pos: 'noun', pronunciation: 'ypodomi' },
  { source: 'methodology', target: 'μεθοδολογία', rank: 2008, pos: 'noun', pronunciation: 'methodologia' },
  { source: 'paradigm', target: 'παράδειγμα', rank: 2009, pos: 'noun', variants: ['paradigms'], pronunciation: 'paradeigma' },
  { source: 'criterion', target: 'κριτήριο', rank: 2010, pos: 'noun', variants: ['criteria'], pronunciation: 'kritirio' },
  { source: 'comprehend', target: 'κατανοώ', rank: 2011, pos: 'verb', variants: ['comprehends', 'comprehended'], pronunciation: 'katanoo' },
  { source: 'elaborate', target: 'επεξεργάζομαι', rank: 2012, pos: 'verb', variants: ['elaborates', 'elaborated'], pronunciation: 'epexergazome' },
  { source: 'facilitate', target: 'διευκολύνω', rank: 2013, pos: 'verb', variants: ['facilitates', 'facilitated'], pronunciation: 'diefkolyno' },
  { source: 'implement', target: 'υλοποιώ', rank: 2014, pos: 'verb', variants: ['implements', 'implemented'], pronunciation: 'ylopoio' },
  { source: 'articulate', target: 'διατυπώνω', rank: 2015, pos: 'verb', variants: ['articulates', 'articulated'], pronunciation: 'diatypono' },
  { source: 'sophisticated', target: 'εκλεπτυσμένος', rank: 2016, pos: 'adjective', pronunciation: 'ekleptismenos' },
  { source: 'inevitable', target: 'αναπόφευκτος', rank: 2017, pos: 'adjective', pronunciation: 'anapofevktos' },
  { source: 'ambiguous', target: 'διφορούμενος', rank: 2018, pos: 'adjective', pronunciation: 'diforoumenos' },
  { source: 'comprehensive', target: 'ολοκληρωμένος', rank: 2019, pos: 'adjective', pronunciation: 'olokliroménos' },
  { source: 'substantial', target: 'ουσιαστικός', rank: 2020, pos: 'adjective', pronunciation: 'ousiastikos' },
  { source: 'preliminary', target: 'προκαταρκτικός', rank: 2021, pos: 'adjective', pronunciation: 'prokatarktikos' },
  { source: 'subsequent', target: 'επόμενος', rank: 2022, pos: 'adjective', pronunciation: 'epomenos' },
  { source: 'inherent', target: 'εγγενής', rank: 2023, pos: 'adjective', pronunciation: 'engenis' },
  { source: 'fundamental', target: 'θεμελιώδης', rank: 2024, pos: 'adjective', pronunciation: 'themeliodis' },
  { source: 'predominant', target: 'κυρίαρχος', rank: 2025, pos: 'adjective', pronunciation: 'kyriarchos' },
];

// ============================================================================
// Export Combined Word List
// ============================================================================

export const ALL_WORDS_EN_EL: WordData[] = [
  ...BEGINNER_WORDS,
  ...INTERMEDIATE_WORDS,
  ...ADVANCED_WORDS,
];

/**
 * Get words by proficiency level
 */
export function getWordsByLevel(level: 'beginner' | 'intermediate' | 'advanced'): WordData[] {
  switch (level) {
    case 'beginner':
      return BEGINNER_WORDS;
    case 'intermediate':
      return INTERMEDIATE_WORDS;
    case 'advanced':
      return ADVANCED_WORDS;
    default:
      return [];
  }
}

/**
 * Get total word count
 */
export function getTotalWordCount(): number {
  return ALL_WORDS_EN_EL.length;
}
