import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"

from fastapi import HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import random
from datetime import datetime
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification


# -----------------------------------------------------------
# MODEL LOAD
# -----------------------------------------------------------
MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"
print("Loading model... Please wait...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
print("Model loaded successfully!")


# -----------------------------------------------------------
# REQUEST/RESPONSE MODELS
# -----------------------------------------------------------
class TextInput(BaseModel):
    user_id: str
    text: str


class AnalysisResult(BaseModel):
    emotion: str
    stress_level: str
    academic_stress_category: str
    risk_level: str
    overall_status: str
    bot_response: str


class ChatStartResponse(BaseModel):
    session_id: str


class ChatMessageInput(BaseModel):
    session_id: str
    text: str


class ChatMessageResponse(BaseModel):
    bot_message: str
    emotion: str
    stress_level: str
    academic_stress_category: str
    risk_level: str
    overall_status: str
    techniques: List[str]


# -----------------------------------------------------------
# EMOTION  STRESS
# -----------------------------------------------------------
def emotion_to_stress(emotion: str) -> str:
    if emotion in ["fear", "sadness", "anger", "disgust"]:
        return "high"
    if emotion == "surprise":
        return "medium"
    return "low"


# -----------------------------------------------------------
# ACADEMIC STRESS DETECTOR
# -----------------------------------------------------------
def academic_stress_classifier(text: str, emotion: str) -> str:
    """Heuristic classifier focused on academic / study stress.

    Combines simple keyword spotting with the detected emotion.
    """

    t = text.lower()

    high_k = [
        "overwhelmed",
        "can't handle",
        "hopeless",
        "panic",
        "breakdown",
        "giving up",
        "end it",
        "crisis",
    ]
    med_k = [
        "stressed",
        "pressure",
        "anxious",
        "worried",
        "tired",
        "frustrated",
        "behind",
        "can't focus",
        "cant focus",
        "procrastinating",
        "procrastination",
    ]
    burnout_k = [
        "burnout",
        "burnt out",
        "exhausted",
        "drained",
        "no energy",
        "fatigued",
        "done with everything",
    ]
    academic_k = [
        "exam",
        "exams",
        "midterm",
        "final",
        "quiz",
        "assignment",
        "assignments",
        "deadline",
        "due",
        "project",
        "thesis",
        "dissertation",
        "university",
        "college",
        "school",
        "lectures",
        "lecture",
        "coursework",
        "gpa",
        "grades",
        "mark",
        "marks",
        "study",
        "studies",
        "studying",
    ]

    if any(w in t for w in high_k):
        return "academic_stress_high"
    if any(w in t for w in burnout_k):
        return "burnout"
    if any(w in t for w in med_k):
        return "academic_stress_medium"

    if any(w in t for w in academic_k):
        if emotion in ["fear", "sadness", "anger"]:
            return "academic_stress_high"
        if emotion == "surprise":
            return "academic_stress_medium"
        return "academic_stress_low"

    if emotion in ["fear", "sadness", "anger"]:
        return "academic_stress_medium"

    return "academic_stress_low"


# -----------------------------------------------------------
# RISK DETECTOR
# -----------------------------------------------------------
def risk_detector(text: str) -> str:
    t = text.lower()

    high_risk = ["suicide", "kill myself", "end my life", "i want to die", "no reason to live", "end it all"]
    med_risk = ["hopeless", "worthless", "nothing matters", "empty inside"]

    if any(w in t for w in high_risk):
        return "high_risk"
    if any(w in t for w in med_risk):
        return "moderate_risk"
    return "safe"


# -----------------------------------------------------------
# OVERALL STATUS ENGINE
# -----------------------------------------------------------
def overall_status_engine(emotion: str, stress: str, academic_stress: str, risk: str) -> str:
    if risk == "high_risk":
        return "critical"
    if risk == "moderate_risk":
        return "high_stress"
    if academic_stress in ["academic_stress_high", "burnout"]:
        return "high_stress"
    if academic_stress == "academic_stress_medium" or stress == "medium":
        return "moderate_stress"
    if stress == "low" and academic_stress == "academic_stress_low":
        return "low_stress"
    return "normal"


# -----------------------------------------------------------
# COUNSELING RESPONSE GENERATOR
# -----------------------------------------------------------
def generate_response(overall_status: str, emotion: str, academic_stress: str, risk: str) -> str:
    if overall_status == "critical":
        return (
            "I'm really sorry you're feeling this way. Your feelings matter, "
            "and you're not alone. If you're in immediate danger or feel you "
            "might harm yourself, please contact emergency services or a suicide hotline right now."
        )

    if overall_status == "high_stress":
        return (
            "It sounds like you're under a lot of pressure right now. "
            "Thank you for opening up — that takes courage. "
            "Let’s take one step at a time. What feels hardest for you right now?"
        )

    if overall_status == "moderate_stress":
        return (
            "I hear that things are tough for you. "
            "It's okay to feel overwhelmed. I'm here to support you. "
            "What part of this feels the most stressful?"
        )

    if overall_status == "low_stress":
        return (
            "It seems like you're dealing with some stress, but you're holding up. "
            "How can I help you with what you're experiencing?"
        )

    return "Thank you for sharing. How can I support you today?"


# -----------------------------------------------------------
# THERAPEUTIC TECHNIQUES
# -----------------------------------------------------------
def suggest_techniques(emotion: str, academic_stress: str) -> List[str]:
    """Return a small set of concrete coping techniques.

    The names are interpreted on the frontend, where more detailed
    instructions can be shown.
    """

    techniques: List[str] = []

    if emotion in ["fear", "surprise"]:
        techniques += ["5-4-3-2-1 grounding", "Box breathing (4-4-4-4)"]

    if emotion == "sadness":
        techniques += ["Self-compassion check-in", "Small activation task"]

    if emotion == "anger":
        techniques += ["4-7-8 breathing", "Cognitive defusion"]

    if academic_stress == "burnout":
        techniques += ["5-minute micro-break", "Energy audit"]

    if academic_stress.startswith("academic_stress_"):
        techniques += ["Task chunking (25/5 Pomodoro)", "Two-minute small start"]

    # Fallback general tools
    if not techniques:
        techniques = ["Mindful breathing"]

    # Keep list short and unique
    deduped: List[str] = []
    for t in techniques:
        if t not in deduped:
            deduped.append(t)

    return deduped[:4]


# -----------------------------------------------------------
# THERAPEUTIC REPLY (SESSION MODE)
# -----------------------------------------------------------
def _classify_theme_from_history(messages: List[Dict[str, Any]], latest_text: str) -> str:
    """Roughly classify what the user is talking about (studies, relationships, work/general)."""

    combined = " ".join(m.get("text", "") for m in messages if m.get("role") == "user")
    combined += " " + latest_text
    t = combined.lower()

    academic_terms = [
        "exam",
        "assignment",
        "lecture",
        "school",
        "university",
        "college",
        "gpa",
        "grade",
        "project",
        "thesis",
        "study",
        "studying",
    ]
    relationship_terms = [
        "friend",
        "friends",
        "relationship",
        "partner",
        "boyfriend",
        "girlfriend",
        "family",
        "parents",
        "mom",
        "dad",
    ]
    work_terms = ["job", "work", "shift", "boss", "office"]

    if any(w in t for w in academic_terms):
        return "studies"
    if any(w in t for w in relationship_terms):
        return "relationships"
    if any(w in t for w in work_terms):
        return "work"
    return "general"


def _detect_cbt_pattern(text: str) -> Optional[str]:
    """Very simple CBT-style helper.

    Looks for common thinking patterns and returns a gentle
    reframe if something is detected. This is *not* a
    clinical tool, just a conversational aid.
    """

    t = text.lower()

    all_or_nothing = ["always", "never", "completely fail", "ruined everything"]
    catastrophizing = ["disaster", "ruined", "no way out", "everything will go wrong"]
    mind_reading = ["everyone thinks", "they all think", "people will think"]
    self_criticism = ["i'm useless", "i am useless", "i'm stupid", "i am stupid", "i'm a failure", "i am a failure"]

    if any(p in t for p in self_criticism):
        return (
            "I also notice some really harsh thoughts about yourself. It might help to ask what you'd say to a close friend who felt this way."
        )

    if any(p in t for p in all_or_nothing):
        return (
            "It sounds like your mind is pulling things into all-or-nothing terms. Sometimes it helps to look for small moments that don't fully fit the 'always' or 'never' story."
        )

    if any(p in t for p in catastrophizing):
        return (
            "Some of what you wrote sounds like your mind is jumping straight to the worst-case outcome. Taking a moment to ask what's most likely, not just most scary, can sometimes soften that."
        )

    if any(p in t for p in mind_reading):
        return (
            "You mentioned worrying a lot about what others might think. It's easy to slip into guessing other people's thoughts, even when we don't really know."
        )

    return None


# -----------------------------------------------------------
# CONVERSATION HELPERS & TREND DETECTION
# -----------------------------------------------------------

def _extract_user_name(text: str) -> Optional[str]:
    """Very lightweight name extractor ("I'm Alex", "I am Priya")."""

    lowered = text.strip()
    for prefix in ["i'm ", "im ", "i am ", "my name is ", "this is "]:
        idx = lowered.lower().find(prefix)
        if idx != -1:
            possible = lowered[idx + len(prefix) :].split()
            if possible:
                name = possible[0].strip(",.!? ")
                if name and 1 <= len(name) <= 20:
                    return name.capitalize()
    return None


def _update_session_memory(session: Dict[str, Any], text: str, theme: str) -> None:
    """Update simple session-level memory: name, main theme, recurring triggers."""

    memory = session.setdefault(
        "memory",
        {
            "user_name": None,
            "main_theme": "general",
            "stress_triggers": {},
            "awaiting_technique_consent": False,
            "last_technique_reason": None,
        },
    )

    name = _extract_user_name(text)
    if name and not memory.get("user_name"):
        memory["user_name"] = name

    if memory.get("main_theme") == "general" and theme != "general":
        memory["main_theme"] = theme

    # Very small trigger tracker
    trigger_keywords = [
        "exam",
        "exams",
        "deadline",
        "assignment",
        "parents",
        "friend",
        "friends",
        "boss",
        "money",
        "grades",
    ]
    lowered = text.lower()
    for kw in trigger_keywords:
        if kw in lowered:
            memory["stress_triggers"][kw] = memory["stress_triggers"].get(kw, 0) + 1


def get_recent_stress_levels(messages: List[Dict[str, Any]], limit: int = 5) -> List[str]:
    """Return stress levels for the most recent user messages (oldest -> newest)."""

    user_msgs = [m for m in messages if m.get("role") == "user" and m.get("stress")]
    recent = user_msgs[-limit:]
    return [str(m.get("stress")) for m in recent]


def detect_stress_escalation(messages: List[Dict[str, Any]]) -> bool:
    """Detect pattern low -> medium -> high across recent user turns."""

    levels = get_recent_stress_levels(messages, limit=3)
    if len(levels) < 3:
        return False

    order = {"low": 0, "medium": 1, "high": 2}
    try:
        values = [order.get(l, 0) for l in levels]
    except Exception:
        return False

    return values[0] < values[1] < values[2]


def _has_persistent_high_stress(messages: List[Dict[str, Any]], window: int = 2) -> bool:
    levels = get_recent_stress_levels(messages, limit=window)
    return len(levels) == window and all(l == "high" for l in levels)


def _has_negative_keywords(text: str) -> bool:
    negatives = [
        "stressed",
        "stress",
        "anxious",
        "anxiety",
        "depressed",
        "sad",
        "overwhelmed",
        "hopeless",
        "tired",
        "burnout",
        "lonely",
        "scared",
        "worried",
    ]
    lowered = text.lower()
    return any(w in lowered for w in negatives)


def detect_emotional_trend(messages: List[Dict[str, Any]]) -> Optional[str]:
    """Return a short trend description if things seem to be worsening."""

    if detect_stress_escalation(messages):
        return "I notice things seem to be getting heavier compared to earlier."
    return None


def _user_explicitly_asks_for_help(text: str) -> bool:
    lowered = text.lower()
    phrases = [
        "can you help",
        "i need help",
        "what should i do",
        "any advice",
        "give me advice",
        "what do i do",
        "how do i deal",
        "coping strategy",
        "coping strategies",
        "technique that might help",
        "breathing exercise",
    ]
    return any(p in lowered for p in phrases)


def should_suggest_techniques(
    stress: str,
    academic_stress: str,
    risk: str,
    messages: List[Dict[str, Any]],
    user_text: str,
) -> tuple[bool, Optional[str]]:
    """Decide whether techniques *should* be offered (permission will be asked first).

    Reasons:
    - "persistent_high_stress": high stress for 2+ consecutive user turns
    - "burnout": explicit burnout pattern
    - "user_asked": user directly asked for help
    - "moderate_risk_escalation": moderate risk with rising stress
    """

    if _user_explicitly_asks_for_help(user_text):
        return True, "user_asked"

    if academic_stress == "burnout":
        return True, "burnout"

    if _has_persistent_high_stress(messages, window=2):
        return True, "persistent_high_stress"

    if risk == "moderate_risk" and detect_stress_escalation(messages):
        return True, "moderate_risk_escalation"

    return False, None


def _build_validation(
    emotion: str,
    stress: str,
    academic_stress: str,
    risk: str,
    theme: str,
    user_name: Optional[str],
) -> str:
    """Short, varied validation line (1 sentence)."""

    name_prefix = f"{user_name}, " if user_name else ""

    high_templates = [
        f"{name_prefix}thanks for sharing this with me, it really sounds like a lot to handle.",
        f"{name_prefix}I'm really glad you told me what's going on, it sounds really intense.",
        f"{name_prefix}it makes sense that this feels heavy right now, and I'm here with you in it.",
    ]

    moderate_templates = [
        f"{name_prefix}I hear that this has been weighing on you.",
        f"{name_prefix}it sounds like things have been a bit much lately.",
        f"{name_prefix}thank you for being honest about how you're doing.",
    ]

    low_templates = [
        f"{name_prefix}it's nice that you felt safe enough to share this.",
        f"{name_prefix}I'm glad you're talking about how things feel, even when they're not at their worst.",
        f"{name_prefix}it's totally okay to check in even when things are mostly okay.",
    ]

    if risk == "high_risk":
        base = [
            f"{name_prefix}I'm really relieved you reached out and told me this.",
            f"{name_prefix}I'm really glad you're not keeping this all inside right now.",
        ]
        return random.choice(base)

    if stress == "high" or academic_stress in ["academic_stress_high", "burnout"]:
        return random.choice(high_templates)

    if stress == "medium" or academic_stress == "academic_stress_medium":
        return random.choice(moderate_templates)

    return random.choice(low_templates)


def _emotion_phrase(emotion: str) -> str:
    mapping = {
        "sadness": "sad or low",
        "joy": "a mix of okay and not-okay feelings",
        "anger": "frustrated or irritated",
        "fear": "anxious or on edge",
        "surprise": "a bit shaken up",
        "love": "really emotionally full",
    }
    return mapping.get(emotion, "a lot of different emotions")


def _build_reflection(
    text: str,
    emotion: str,
    academic_stress: str,
    theme: str,
    emotion_confidence: float,
    messages: List[Dict[str, Any]],
) -> str:
    """One–two sentences of gentle reflection, with trend + confidence awareness."""

    parts: List[str] = []

    if theme == "studies":
        parts.append("it sounds like there's a lot of pressure around your studies and academic load.")
    elif theme == "relationships":
        parts.append("it sounds like the people in your life and those relationships are really on your mind.")
    elif theme == "work":
        parts.append("it sounds like work and responsibilities have been sitting heavily with you.")
    else:
        parts.append("it sounds like you've been carrying quite a bit inside lately.")

    if academic_stress == "burnout":
        parts.append("feeling so drained for this long is usually a sign you've been pushing yourself for a long time.")
    elif academic_stress == "academic_stress_high":
        parts.append("many people would feel under a lot of strain in a situation like this.")
    elif academic_stress == "academic_stress_medium":
        parts.append("it's completely understandable that this feels stressful.")

    trend_line = detect_emotional_trend(messages)
    if trend_line:
        parts.append(trend_line)

    if emotion_confidence < 0.6:
        parts.append(f"I might be slightly off, but it sounds like you're feeling {_emotion_phrase(emotion)} about all of this.")
    else:
        parts.append(f"it really sounds like you've been feeling {_emotion_phrase(emotion)} about everything that's going on.")

    # Keep to roughly 2–3 sentences
    return " ".join(parts[:3])


def _build_followup(
    risk: str,
    academic_stress: str,
    theme: str,
    memory: Dict[str, Any],
) -> str:
    """Small, conversational follow‑up question (1 sentence)."""

    # Possible callback to earlier theme/trigger
    callback: Optional[str] = None
    triggers = memory.get("stress_triggers", {}) if memory else {}
    main_theme = memory.get("main_theme") if memory else None

    if main_theme == "studies" and any(k in triggers for k in ["exam", "exams", "deadline", "assignment"]):
        callback = "earlier you mentioned exams and deadlines really getting to you. Is that still sitting in the back of your mind?"
    elif main_theme == "relationships" and any(k in triggers for k in ["friend", "friends", "parents"]):
        callback = "you mentioned relationships earlier — is that part still weighing on you today?"

    if risk == "high_risk":
        return (
            "would you feel okay sharing a bit more about what's felt hardest today, and is there anyone nearby you could reach out to?"
        )

    if callback:
        return callback

    if academic_stress in ("academic_stress_high", "burnout") or theme == "studies":
        return "of everything you're dealing with, what's feeling most stressful for you right now?"

    if theme == "relationships":
        return "what part of these relationship worries feels most important to talk about next?"

    return "what feels most important for you to talk about right now?"


def _build_light_mode_reply(text: str) -> str:
    templates = [
        "That's good to hear 🙂 Anything interesting happening today?",
        "I'm glad things aren't feeling too heavy right now. What's been going on?",
        "Nice, it sounds like things are fairly okay at the moment. What's on your mind?",
    ]
    return random.choice(templates)


def _build_permission_question() -> str:
    templates = [
        "Would you like a small technique that might help right now?",
        "If you'd find it useful, I can share a short coping technique — would you like that?",
        "I can suggest a tiny exercise that some people find calming. Want to hear it?",
    ]
    return random.choice(templates)


def generate_therapeutic_reply(
    text: str,
    emotion: str,
    stress: str,
    academic_stress: str,
    risk: str,
    session: Dict[str, Any],
    emotion_confidence: float,
):
    """Generate a natural, listener‑first reply.

    Conversation structure: Validate → Reflect → Small Question → (Optional Techniques Later).
    Techniques are suggested only when conditions are met *and* the user has agreed.
    """

    messages: List[Dict[str, Any]] = session.get("messages", [])
    memory: Dict[str, Any] = session.get("memory", {})

    turns = sum(1 for m in messages if m.get("role") == "user")
    theme = _classify_theme_from_history(messages, text)
    _update_session_memory(session, text, theme)
    memory = session.get("memory", {})  # refresh after update
    user_name = memory.get("user_name")

    stripped = text.strip()
    lower = stripped.lower()

    # High‑risk: keep soft, human, safety‑first language
    if risk == "high_risk":
        bot_message = (
            "I'm really glad you told me this. Your safety matters more than anything right now. "
            "I'm not able to contact anyone for you, but I really care about your wellbeing. "
            "If you feel like you might hurt yourself or you're in immediate danger, please reach out to emergency services "
            "or a crisis hotline in your area as soon as you can. You deserve support from real people around you."
        )
        return {
            "bot_message": bot_message,
            "techniques": [
                "Call emergency services",
                "Reach out to a trusted person",
            ],
        }

    # Simple, human greeting
    greeting_words = ["hi", "hey", "hello"]
    is_simple_greeting = (
        len(stripped.split()) <= 4
        and any(lower == g or lower.startswith(g + " ") for g in greeting_words)
        and not _has_negative_keywords(text)
    )

    if is_simple_greeting:
        return {
            "bot_message": "Hey 🙂 I'm really glad you reached out. How are you feeling today?",
            "techniques": [],
        }

    # Light mode: low stress and no obvious negative language
    if stress == "low" and academic_stress == "academic_stress_low" and risk == "safe" and not _has_negative_keywords(text):
        return {
            "bot_message": _build_light_mode_reply(text),
            "techniques": [],
        }

    # Always determine techniques for this message (non-light, non-greeting, non-high-risk)
    techniques: List[str] = suggest_techniques(emotion, academic_stress)

    # Core conversational pieces
    validation = _build_validation(emotion, stress, academic_stress, risk, theme, user_name)
    reflection = _build_reflection(text, emotion, academic_stress, theme, emotion_confidence, messages)
    followup = _build_followup(risk, academic_stress, theme, memory)

    parts: List[str] = []
    parts.append(validation)
    parts.append(reflection)

    if techniques:
        techniques_line = (
            "Here are a couple of small techniques that might help right now: "
            + ", ".join(techniques)
            + "."
        )
        parts.append(techniques_line)

    parts.append(followup)

    # Keep responses compact: 3–5 sentences
    bot_message = " ".join(parts[:5])

    return {"bot_message": bot_message, "techniques": techniques}


# -----------------------------------------------------------
# IN-MEMORY SESSION STORE
# -----------------------------------------------------------
Sessions: Dict[str, Dict[str, Any]] = {}


# -----------------------------------------------------------
# SERVICE FUNCTIONS
# -----------------------------------------------------------

def health_service() -> Dict[str, str]:
    return {"status": "ok"}


def analyze_text_service(input: TextInput) -> AnalysisResult:
    try:
        user_id = input.user_id
        text = input.text.strip()

        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        with torch.no_grad():
            tokens = tokenizer(text, return_tensors="pt", truncation=True, max_length=256)
            outputs = model(**tokens)
            probs = torch.softmax(outputs.logits, dim=1)
            emotion = model.config.id2label[int(torch.argmax(probs))]

        stress = emotion_to_stress(emotion)
        academic_stress = academic_stress_classifier(text, emotion)
        risk = risk_detector(text)
        overall = overall_status_engine(emotion, stress, academic_stress, risk)
        bot_response = generate_response(overall, emotion, academic_stress, risk)

        analysis = AnalysisResult(
            emotion=emotion,
            stress_level=stress,
            academic_stress_category=academic_stress,
            risk_level=risk,
            overall_status=overall,
            bot_response=bot_response,
        )

        # user_id is currently unused but kept for future extension
        _ = user_id

        return analysis

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {e}")


def chat_start_service() -> ChatStartResponse:
    session_id = str(uuid.uuid4())
    Sessions[session_id] = {
        "messages": [],
        "memory": {
            "user_name": None,
            "main_theme": "general",
            "stress_triggers": {},
            "awaiting_technique_consent": False,
            "last_technique_reason": None,
        },
    }
    return ChatStartResponse(session_id=session_id)


def chat_message_service(input: ChatMessageInput) -> ChatMessageResponse:
    try:
        session_id = input.session_id
        text = input.text.strip()

        if session_id not in Sessions:
            raise HTTPException(status_code=404, detail="Session not found")

        if not text:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        with torch.no_grad():
            tokens = tokenizer(text, return_tensors="pt", truncation=True, max_length=256)
            outputs = model(**tokens)
            probs = torch.softmax(outputs.logits, dim=1)
            pred_id = int(torch.argmax(probs))
            emotion = model.config.id2label[pred_id]
            emotion_confidence = float(probs[0, pred_id])

        stress = emotion_to_stress(emotion)
        academic_stress = academic_stress_classifier(text, emotion)
        risk = risk_detector(text)

        overall = overall_status_engine(emotion, stress, academic_stress, risk)

        # Ensure session structure is present (for any legacy sessions)
        session = Sessions.get(session_id) or {}
        if "messages" not in session:
            session = {
                "messages": session if isinstance(session, list) else [],
                "memory": {
                    "user_name": None,
                    "main_theme": "general",
                    "stress_triggers": {},
                    "awaiting_technique_consent": False,
                    "last_technique_reason": None,
                },
            }

        # Append current user message with emotional metadata for trend tracking
        session.setdefault("messages", []).append(
            {
                "role": "user",
                "text": text,
                "emotion": emotion,
                "stress": stress,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        reply = generate_therapeutic_reply(
            text,
            emotion,
            stress,
            academic_stress,
            risk,
            session,
            emotion_confidence,
        )
        bot_message = reply["bot_message"]
        techniques = reply["techniques"]

        session.setdefault("messages", []).append(
            {
                "role": "bot",
                "text": bot_message,
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        Sessions[session_id] = session

        return ChatMessageResponse(
            bot_message=bot_message,
            emotion=emotion,
            stress_level=stress,
            academic_stress_category=academic_stress,
            risk_level=risk,
            overall_status=overall,
            techniques=techniques,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {e}")
