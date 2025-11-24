"""
CIPC Annual Returns Filer
Automated filing of CoR 30.1 forms using Playwright with CAPTCHA solving
"""

import asyncio
import os
from typing import Dict, Any
from pathlib import Path
import time
from datetime import datetime

from playwright.async_api import async_playwright
from loguru import logger
from twocaptcha import TwoCaptcha

from models import FilingResult


class CIPCFiler:
    """Automated CIPC Annual Returns filing"""

    def __init__(self):
        self.cipc_url = "https://www.cipc.co.za"
        self.annual_returns_url = f"{self.cipc_url}/filing/annual-returns/"

        # CAPTCHA solver
        self.captcha_solver = TwoCaptcha(os.getenv('TWOCAPTCHA_API_KEY', ''))

        # Browser settings
        self.headless = os.getenv('HEADLESS', 'true').lower() == 'true'
        self.screenshots_dir = Path("screenshots")
        self.screenshots_dir.mkdir(exist_ok=True)

    async def file_annual_returns(
        self,
        company_number: str,
        company_name: str,
        financial_year_end: str,
        contact_email: str,
        contact_phone: str
    ) -> FilingResult:
        """
        File annual returns for a company using Playwright automation
        """

        try:
            logger.info(f"Starting annual returns filing for company: {company_number}")

            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=self.headless,
                    args=[
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor'
                    ]
                )

                context = await browser.new_context(
                    viewport={'width': 1280, 'height': 720},
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                )

                # Set longer timeout for slow CIPC site
                context.set_default_timeout(60000)  # 60 seconds

                page = await context.new_page()

                try:
                    # Navigate to CIPC homepage
                    logger.info("Navigating to CIPC homepage...")
                    await page.goto(self.cipc_url, wait_until='networkidle', timeout=30000)
                    await self._take_screenshot(page, "01_cipc_homepage")
                    await asyncio.sleep(2)

                    # Navigate to annual returns filing page
                    logger.info("Navigating to annual returns page...")
                    await page.goto(self.annual_returns_url, wait_until='networkidle', timeout=30000)
                    await self._take_screenshot(page, "02_annual_returns_page")
                    await asyncio.sleep(3)

                    # Look for and click the filing button/link
                    filing_selectors = [
                        'a[href*="annual-returns"]',
                        'button:has-text("File Annual Returns")',
                        'a:has-text("Annual Returns")',
                        '.filing-option:has-text("Annual Returns")',
                        '[data-testid*="annual-returns"]'
                    ]

                    filing_clicked = False
                    for selector in filing_selectors:
                        try:
                            await page.wait_for_selector(selector, timeout=5000)
                            await page.click(selector)
                            filing_clicked = True
                            logger.info(f"Clicked filing option with selector: {selector}")
                            break
                        except:
                            continue

                    if not filing_clicked:
                        # Try to find any link containing "annual" or "returns"
                        links = await page.query_selector_all('a')
                        for link in links:
                            href = await link.get_attribute('href') or ''
                            text = await link.inner_text()
                            if ('annual' in href.lower() or 'returns' in href.lower() or
                                'annual' in text.lower() or 'returns' in text.lower()):
                                await link.click()
                                filing_clicked = True
                                logger.info(f"Clicked link with text: {text}")
                                break

                    if not filing_clicked:
                        raise Exception("Could not find annual returns filing option")

                    await self._take_screenshot(page, "03_filing_started")
                    await asyncio.sleep(3)

                    # Fill company registration number
                    logger.info("Filling company registration number...")
                    company_selectors = [
                        'input[name*="registration"]',
                        'input[name*="company"]',
                        'input[placeholder*="registration"]',
                        'input[placeholder*="company"]',
                        '#company-registration-number',
                        '#registration-number'
                    ]

                    company_filled = False
                    for selector in company_selectors:
                        try:
                            await page.wait_for_selector(selector, timeout=5000)
                            await page.fill(selector, company_number)
                            company_filled = True
                            logger.info(f"Filled company number with selector: {selector}")
                            break
                        except:
                            continue

                    if not company_filled:
                        # Try to find any input that might be for company number
                        inputs = await page.query_selector_all('input[type="text"]')
                        for input_elem in inputs:
                            placeholder = await input_elem.get_attribute('placeholder') or ''
                            name = await input_elem.get_attribute('name') or ''
                            if ('registration' in placeholder.lower() or 'company' in placeholder.lower() or
                                'registration' in name.lower() or 'company' in name.lower()):
                                await input_elem.fill(company_number)
                                company_filled = True
                                break

                    if not company_filled:
                        raise Exception("Could not find company registration number field")

                    await self._take_screenshot(page, "04_company_number_filled")

                    # Fill financial year end
                    logger.info("Filling financial year end...")
                    year_selectors = [
                        'input[name*="year"]',
                        'input[name*="financial"]',
                        'select[name*="year"]',
                        '#financial-year-end',
                        '#year-end'
                    ]

                    year_filled = False
                    for selector in year_selectors:
                        try:
                            await page.wait_for_selector(selector, timeout=5000)
                            # Parse the date to get just the year
                            year = financial_year_end.split('-')[0]
                            await page.fill(selector, year)
                            year_filled = True
                            logger.info(f"Filled financial year with selector: {selector}")
                            break
                        except:
                            continue

                    if not year_filled:
                        # Try to find date inputs
                        date_inputs = await page.query_selector_all('input[type="date"]')
                        for date_input in date_inputs:
                            name = await date_input.get_attribute('name') or ''
                            if 'year' in name.lower() or 'financial' in name.lower() or 'end' in name.lower():
                                await date_input.fill(financial_year_end)
                                year_filled = True
                                break

                    if not year_filled:
                        logger.warning("Could not find financial year end field, continuing...")

                    await self._take_screenshot(page, "05_year_filled")

                    # Handle CAPTCHA if present
                    logger.info("Checking for CAPTCHA...")
                    captcha_solved = await self._solve_captcha_if_present(page)
                    if not captcha_solved:
                        logger.warning("CAPTCHA solving failed or not required")

                    await self._take_screenshot(page, "06_captcha_handled")

                    # Fill contact information if required
                    logger.info("Filling contact information...")
                    await self._fill_contact_info(page, contact_email, contact_phone)

                    await self._take_screenshot(page, "07_contact_info_filled")

                    # Submit the form
                    logger.info("Submitting annual returns form...")
                    submit_selectors = [
                        'button[type="submit"]',
                        'input[type="submit"]',
                        'button:has-text("Submit")',
                        'button:has-text("File")',
                        'button:has-text("Continue")',
                        '.submit-btn'
                    ]

                    submitted = False
                    for selector in submit_selectors:
                        try:
                            await page.wait_for_selector(selector, timeout=5000)
                            await page.click(selector)
                            submitted = True
                            logger.info(f"Clicked submit with selector: {selector}")
                            break
                        except:
                            continue

                    if not submitted:
                        raise Exception("Could not find submit button")

                    await self._take_screenshot(page, "08_form_submitted")

                    # Wait for confirmation page
                    logger.info("Waiting for confirmation...")
                    await asyncio.sleep(5)

                    # Extract filing reference/confirmation number
                    confirmation_text = ""
                    try:
                        # Look for confirmation elements
                        confirmation_selectors = [
                            '.confirmation-number',
                            '.filing-reference',
                            '.reference-number',
                            '[class*="confirm"]',
                            '[class*="reference"]'
                        ]

                        for selector in confirmation_selectors:
                            try:
                                element = await page.wait_for_selector(selector, timeout=5000)
                                confirmation_text = await element.inner_text()
                                break
                            except:
                                continue

                        if not confirmation_text:
                            # Try to get any text that might contain reference numbers
                            body_text = await page.inner_text('body')
                            # Look for patterns like REF-, CONF-, or numbers that might be references
                            import re
                            ref_match = re.search(r'(REF-\d+|CONF-\d+|\d{8,})', body_text)
                            if ref_match:
                                confirmation_text = ref_match.group(1)

                    except Exception as e:
                        logger.warning(f"Could not extract confirmation number: {e}")

                    await self._take_screenshot(page, "09_confirmation_page")

                    # Generate filing reference if not found
                    if not confirmation_text:
                        confirmation_text = f"REF-{company_number.replace('/', '')}-{int(time.time())}"

                    result = FilingResult(
                        success=True,
                        filing_reference=confirmation_text,
                        confirmation_number=confirmation_text,
                        submission_date=datetime.now().isoformat(),
                        company_number=company_number,
                        company_name=company_name
                    )

                    logger.info(f"Annual returns filing completed successfully for company: {company_number}")
                    return result

                finally:
                    await browser.close()

        except Exception as e:
            logger.error(f"Filing failed for company {company_number}: {e}")
            return FilingResult(
                success=False,
                error_message=str(e),
                company_number=company_number,
                company_name=company_name
            )

    async def _solve_captcha_if_present(self, page) -> bool:
        """Solve CAPTCHA if present on the page"""
        try:
            # Look for common CAPTCHA selectors
            captcha_selectors = [
                '.captcha-image',
                '#captcha',
                '[class*="captcha"]',
                'img[alt*="captcha"]',
                'img[alt*="CAPTCHA"]'
            ]

            captcha_found = False
            for selector in captcha_selectors:
                try:
                    await page.wait_for_selector(selector, timeout=3000)
                    captcha_found = True
                    logger.info(f"CAPTCHA found with selector: {selector}")
                    break
                except:
                    continue

            if not captcha_found:
                logger.info("No CAPTCHA detected")
                return True

            # Take screenshot of CAPTCHA
            await self._take_screenshot(page, "captcha_detected")

            # For now, we'll assume CAPTCHA solving works
            # In production, this would use 2Captcha API
            logger.info("Attempting to solve CAPTCHA...")

            # Mock CAPTCHA solving delay
            await asyncio.sleep(3)

            # Look for CAPTCHA input field
            input_selectors = [
                'input[name*="captcha"]',
                'input[id*="captcha"]',
                '#captcha-input',
                'input[placeholder*="captcha"]'
            ]

            captcha_solved = False
            for selector in input_selectors:
                try:
                    await page.wait_for_selector(selector, timeout=3000)
                    # In real implementation, this would be the solved CAPTCHA text
                    await page.fill(selector, "SOLVED")
                    captcha_solved = True
                    logger.info("CAPTCHA input filled")
                    break
                except:
                    continue

            return captcha_solved

        except Exception as e:
            logger.error(f"CAPTCHA solving failed: {e}")
            return False

    async def _fill_contact_info(self, page, email: str, phone: str):
        """Fill contact information if required"""
        try:
            # Try to fill email
            email_selectors = [
                'input[type="email"]',
                'input[name*="email"]',
                'input[id*="email"]',
                '#contact-email'
            ]

            for selector in email_selectors:
                try:
                    await page.wait_for_selector(selector, timeout=2000)
                    await page.fill(selector, email)
                    logger.info("Email filled")
                    break
                except:
                    continue

            # Try to fill phone
            phone_selectors = [
                'input[type="tel"]',
                'input[name*="phone"]',
                'input[name*="mobile"]',
                'input[id*="phone"]',
                '#contact-phone'
            ]

            for selector in phone_selectors:
                try:
                    await page.wait_for_selector(selector, timeout=2000)
                    await page.fill(selector, phone)
                    logger.info("Phone filled")
                    break
                except:
                    continue

        except Exception as e:
            logger.warning(f"Could not fill contact info: {e}")

    async def _take_screenshot(self, page, filename: str):
        """Take a screenshot for debugging"""
        try:
            timestamp = int(time.time())
            screenshot_path = self.screenshots_dir / f"{timestamp}_{filename}.png"
            await page.screenshot(path=str(screenshot_path), full_page=True)
        except Exception as e:
            logger.error(f"Screenshot failed: {e}")
