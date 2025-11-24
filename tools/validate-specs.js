#!/usr/bin/env node

/**
 * Specification Validation Tool
 * Validates that Markdown specifications follow SSDD best practices
 * Part of BMAD (Business-Model-Architecture-Development) framework
 */

const fs = require('fs');
const path = require('path');

class SpecificationValidator {
  constructor() {
    this.specsDir = path.join(__dirname, '..', 'cipc-agent-prod', 'specs');
    this.validationResults = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    };
    this.issues = [];
  }

  // SSDD Best Practice Validations
  validators = {
    // Verify specification has proper versioning
    versionCheck: (content, filename) => {
      const versionMatch = content.match(/^## Version:\s*(\d+\.\d+\.\d+)/m);
      if (!versionMatch) {
        return { level: 'error', message: 'Missing version header (## Version: x.x.x)' };
      }
      return { level: 'pass' };
    },

    // Verify specification has status tracking
    statusCheck: (content, filename) => {
      const statusMatch = content.match(/^\*\*Status:\*\*\s*(Active|Draft|Deprecated)/m);
      if (!statusMatch) {
        return { level: 'error', message: 'Missing status declaration (**Status:** Active/Draft/Deprecated)' };
      }
      return { level: 'pass' };
    },

    // Check for verification checklists (verify-XX-XX format)
    verificationChecklist: (content, filename) => {
      const verifyPattern = /verify-[A-Z]{3,4}-\d{2,3}/g;
      const matches = content.match(verifyPattern);
      if (!matches || matches.length < 3) {
        return { level: 'warning', message: 'Specification should have verification checklists (verify-XX-XX format)' };
      }
      return { level: 'pass', count: matches.length };
    },

    // Ensure API specifications have proper formatting
    apiSpecificationCheck: (content, filename) => {
      const issues = [];

      // Check for proper API endpoint documentation
      const endpointPattern = /^### ([A-Z]+)\s+(.+)$/gm;
      const endpoints = [];
      let match;
      while ((match = endpointPattern.exec(content)) !== null) {
        const [, method, path] = match;
        if (method === 'POST' || method === 'GET' || method === 'PUT') {
          endpoints.push({ method, path: path.replace(/\s+/g, '').replace(/\(.+\)$/, '') });
        }
      }

      if (filename.includes('payment') && endpoints.length < 2) {
        issues.push('Payment spec should document multiple API endpoints');
      }

      return issues.length > 0 ? { level: 'warning', message: issues.join('; ') } : { level: 'pass' };
    },

    // Check for performance and security requirements
    requirementsCompleteness: (content, filename) => {
      const requirements = {
        performance: /performance|response time|sla|latency/i,
        security: /security|encryption|authentication|authorization/i,
        compliance: /popia|pci|goverance|audit/i,
        monitoring: /monitoring|logging|alert|metric/i
      };

      const missing = [];
      for (const [category, pattern] of Object.entries(requirements)) {
        if (!pattern.test(content)) {
          missing.push(category);
        }
      }

      if (missing.length > 0) {
        return { level: 'warning', message: `Missing requirement sections: ${missing.join(', ')}` };
      }

      return { level: 'pass' };
    },

    // Validate data structure documentation
    dataStructureValidation: (content, filename) => {
      const jsonBlocks = content.match(/```json\n[\s\S]*?\n```/g);
      if (!jsonBlocks) {
        return { level: 'info', message: 'Consider adding JSON examples for API responses' };
      }

      let malformed = 0;
      jsonBlocks.forEach(block => {
        const jsonContent = block.replace(/```json\n/, '').replace(/\n```/, '');
        try {
          JSON.parse(jsonContent);
        } catch (e) {
          malformed++;
        }
      });

      if (malformed > 0) {
        return { level: 'warning', message: `${malformed} malformed JSON example(s) found` };
      }

      return { level: 'pass' };
    }
  };

  async validateSpecification(filename) {
    this.validationResults.total++;

    const filePath = path.join(this.specsDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');

    console.log(`\n🔍 Validating: ${filename}`);
    const fileIssues = [];

    for (const [validatorName, validator] of Object.entries(this.validators)) {
      try {
        const result = validator(content, filename);
        if (result.level === 'error') {
          this.validationResults.failed++;
          fileIssues.push(`❌ ${validatorName}: ${result.message}`);
        } else if (result.level === 'warning') {
          this.validationResults.warnings++;
          fileIssues.push(`⚠️  ${validatorName}: ${result.message}`);
        } else if (result.level === 'pass' && result.count) {
          console.log(`✅ ${validatorName}: ${result.count} verification checklists found`);
        } else {
          console.log(`✅ ${validatorName}: passed`);
        }
      } catch (error) {
        fileIssues.push(`❌ ${validatorName}: validation failed - ${error.message}`);
        this.validationResults.failed++;
      }
    }

    if (fileIssues.length === 0) {
      console.log(`🎉 ${filename} passed all validations!`);
      this.validationResults.passed++;
    } else {
      this.issues.push({
        file: filename,
        issues: fileIssues
      });
    }

    return fileIssues.length === 0;
  }

  async validateAllSpecifications() {
    console.log('🚀 Starting SSDD Specification Validation');
    console.log('Following BMAD (Business-Model-Architecture-Development) principles\n');

    try {
      const files = fs.readdirSync(this.specsDir)
        .filter(file => file.endsWith('.md') && file.startsWith('spec-'));

      console.log(`📋 Found ${files.length} specifications to validate:\n`);

      for (const filename of files) {
        await this.validateSpecification(filename);
      }

      this.printSummary();
      this.generateValidationReport();

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  printSummary() {
    console.log('\n📊 Validation Summary:');
    console.log(`Total specifications: ${this.validationResults.total}`);
    console.log(`Passed: ${this.validationResults.passed} ✅`);
    console.log(`Failed: ${this.validationResults.failed} ❌`);
    console.log(`Warnings: ${this.validationResults.warnings} ⚠️`);
  }

  generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.validationResults,
      issues: this.issues,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(__dirname, '..', 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Detailed report saved to: validation-report.json`);

    if (this.issues.length > 0) {
      console.log('\n🔧 Next Steps:');
      console.log('1. Address critical errors (red items)');
      console.log('2. Review warnings for improvements');
      console.log('3. Consider adding OpenAPI specifications for machine readability');
      console.log('4. Implement automated contract testing');
    }
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.validationResults.failed > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Fix specification validation errors',
        impact: 'Ensures specification compliance and verifiability'
      });
    }

    recommendations.push({
      priority: 'medium',
      action: 'Convert Markdown specs to OpenAPI 3.1 format',
      impact: 'Enables automated API validation and client generation'
    });

    recommendations.push({
      priority: 'medium',
      action: 'Implement specification versioning with semantic versioning',
      impact: 'Ensures backward compatibility and change management'
    });

    recommendations.push({
      priority: 'high',
      action: 'Add automated contract testing from verify- checklists',
      impact: 'Ensures implementation matches specifications'
    });

    if (this.validationResults.warnings > 2) {
      recommendations.push({
        priority: 'low',
        action: 'Enhance specification completeness with missing requirement sections',
        impact: 'Improves specification quality and implementation guidance'
      });
    }

    return recommendations;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new SpecificationValidator();
  validator.validateAllSpecifications();
}

module.exports = SpecificationValidator;
