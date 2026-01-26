from fastapi import APIRouter
from sqlmodel import Session, select
from ..db import engine
from ..models import Profile, Page, Widget

router = APIRouter(prefix="/api", tags=["api"])

@router.get("/health")
def health():
    return {"ok": True}

@router.get("/profiles")
def list_profiles():
    with Session(engine) as s:
        return s.exec(select(Profile)).all()

@router.post("/profiles")
def create_profile(p: Profile):
    with Session(engine) as s:
        s.add(p)
        s.commit()
        s.refresh(p)
        return p

@router.get("/profiles/{profile_id}/pages")
def list_pages(profile_id: int):
    with Session(engine) as s:
        return s.exec(select(Page).where(Page.profile_id == profile_id).order_by(Page.order_index)).all()

@router.post("/pages")
def create_page(page: Page):
    with Session(engine) as s:
        s.add(page)
        s.commit()
        s.refresh(page)
        return page

@router.get("/pages/{page_id}/widgets")
def list_widgets(page_id: int):
    with Session(engine) as s:
        return s.exec(select(Widget).where(Widget.page_id == page_id)).all()

@router.post("/widgets")
def create_widget(w: Widget):
    with Session(engine) as s:
        s.add(w)
        s.commit()
        s.refresh(w)
        return w