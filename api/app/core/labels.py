"""Display labels for enum values, shown in emails (the web app has the same mapping)."""

from app.models.lead import BudgetRange, Country, Service

COUNTRY_LABELS: dict[Country, str] = {
    Country.PAKISTAN: "Pakistan",
    Country.UAE: "UAE",
    Country.UK: "UK",
    Country.OTHER: "Other",
}

SERVICE_LABELS: dict[Service, str] = {
    Service.DIGITAL_MARKETING: "Digital Marketing",
    Service.CREATIVE_DESIGN: "Creative & Graphic Design",
    Service.WEB_SOFTWARE: "Web / Software Development",
    Service.UI_UX_DESIGN: "UI/UX Design",
    Service.VIDEO_CONTENT: "Video & Content Production",
    Service.PUBLIC_RELATIONS: "Public Relations",
    Service.BRANDING: "Branding",
    Service.COPYWRITING: "Copywriting",
    Service.AI_AUTOMATION: "AI & Automation",
    Service.IOT_SMART: "IoT & Smart Digital Solutions",
}

BUDGET_LABELS: dict[BudgetRange, str] = {
    BudgetRange.UNDER_50K: "Under PKR 50k",
    BudgetRange.FROM_50K_TO_150K: "PKR 50k–150k",
    BudgetRange.OVER_150K: "PKR 150k+",
    BudgetRange.NOT_SURE: "Not sure yet",
}
