import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from smtplib import SMTP
from typing import Optional

from fastapi import BackgroundTasks

from app.config import settings

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "emails"


class EmailService:
    def __init__(self):
        self.server = settings.SMTP_SERVER
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_addr = settings.SMTP_FROM
        self.from_name = settings.SMTP_FROM_NAME

    def _load_template(self, template_name: str, **kwargs) -> str:
        path = TEMPLATES_DIR / template_name
        if not path.exists():
            logger.warning(f"Email template not found: {path}")
            html = f"<h1>{template_name.replace('.html', '')}</h1><p>Default content.</p>"
            for k, v in kwargs.items():
                html += f"<p>{k}: {v}</p>"
            return html
        content = path.read_text(encoding="utf-8")
        for k, v in kwargs.items():
            content = content.replace(f"{{{{ {k} }}}}", str(v))
        return content

    def _send_email(self, to_email: str, subject: str, html_body: str) -> bool:
        if not self.username or not self.password:
            logger.warning("SMTP credentials not configured. Skipping email send.")
            return False
        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{self.from_name} <{self.from_addr}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(html_body, "html"))

            with SMTP(self.server, self.port) as smtp:
                smtp.starttls()
                smtp.login(self.username, self.password)
                smtp.send_message(msg)
            logger.info(f"Email sent to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    def send_welcome_email(self, to_email: str, user_name: str, background_tasks: BackgroundTasks) -> None:
        html = self._load_template("welcome.html", user_name=user_name, email=to_email)
        background_tasks.add_task(self._send_email, to_email, "Bienvenue sur BudgetCollab", html)

    def send_password_reset(self, to_email: str, reset_link: str, background_tasks: BackgroundTasks) -> None:
        html = self._load_template("password_reset.html", reset_link=reset_link)
        background_tasks.add_task(self._send_email, to_email, "Réinitialisation de mot de passe - BudgetCollab", html)

    def send_transaction_pending(self, to_email: str, user_name: str, description: str, amount: float, background_tasks: BackgroundTasks) -> None:
        html = self._load_template("transaction_pending.html", user_name=user_name, description=description, amount=f"{amount:.2f}")
        background_tasks.add_task(self._send_email, to_email, "Transaction en attente d'approbation - BudgetCollab", html)

    def send_transaction_approved(self, to_email: str, user_name: str, description: str, amount: float, background_tasks: BackgroundTasks) -> None:
        html = self._load_template("transaction_approved.html", user_name=user_name, description=description, amount=f"{amount:.2f}")
        background_tasks.add_task(self._send_email, to_email, "Transaction approuvée - BudgetCollab", html)

    def send_transaction_rejected(self, to_email: str, user_name: str, description: str, amount: float, background_tasks: BackgroundTasks) -> None:
        html = self._load_template("transaction_rejected.html", user_name=user_name, description=description, amount=f"{amount:.2f}")
        background_tasks.add_task(self._send_email, to_email, "Transaction rejetée - BudgetCollab", html)

    def send_member_added(self, to_email: str, shared_budget_name: str, added_by: str, background_tasks: BackgroundTasks) -> None:
        html = self._load_template("member_added.html", shared_budget_name=shared_budget_name, added_by=added_by)
        background_tasks.add_task(self._send_email, to_email, f"Ajouté à {shared_budget_name} - BudgetCollab", html)

    def send_admin_alert(self, to_email: str, subject: str, message: str, background_tasks: BackgroundTasks) -> None:
        html = self._load_template("admin_alert.html", subject=subject, message=message)
        background_tasks.add_task(self._send_email, to_email, subject, html)


email_service = EmailService()
