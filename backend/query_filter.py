import spacy
import dateparser
from typing import Optional, Tuple, Dict, List

nlp = spacy.load("en_core_web_sm")


def extract_date_entities(text: str) -> List[str]:
    """
    Extract date entities from text using spaCy NER.
    """
    try:
        doc = nlp(text.lower())
        dates = [ent.text for ent in doc.ents if ent.label_ == "DATE"]
        return dates
    except Exception:
        return []


def parse_date_range(dates: List[str]) -> Optional[Tuple[str, str]]:
    """
    Parse a list of date strings into a (start_date_iso, end_date_iso) tuple.
    """
    if not dates:
        return None

    # Parse first date as start, second as end 
    start = dateparser.parse(dates[0])
    end = dateparser.parse(dates) if len(dates) > 1 else None

    start_iso = start.strftime("%Y-%m-%d") if start else None
    end_iso = end.strftime("%Y-%m-%d") if end else start_iso

    if start_iso:
        return start_iso, end_iso
    else:
        return None


def extract_keywords(text: str) -> List[str]:
    """
    Extract keyword intents (nouns and proper nouns excluding stopwords).
    """
    try:
        doc = nlp(text.lower())
        keywords = [token.lemma_ for token in doc if token.pos_ in ("NOUN", "PROPN") and not token.is_stop]
        return keywords
    except Exception:
        return []


def extract_filters_from_query(query: str, user_id: str) -> Dict:
    """
    Extract user_id, date range, and keywords/intent filters from a user query.
    """
    filters = {"user_id": user_id}

    date_entities = extract_date_entities(query)
    date_range = parse_date_range(date_entities)
    if date_range:
        filters["start_date"], filters["end_date"] = date_range

    keywords = extract_keywords(query)
    if keywords:
        filters["keywords"] = keywords

    return filters
    