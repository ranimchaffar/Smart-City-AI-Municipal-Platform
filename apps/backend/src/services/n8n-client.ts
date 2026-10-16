import { MunicipalReportRequest, MunicipalReportResponse } from '../types/index.js';
import { runPhase5Workflow } from './n8n-simulator.js';

export interface N8nExecutionResult {
  response: MunicipalReportResponse;
  source: 'REAL_N8N_WEBHOOK' | 'EXPLICIT_SIMULATED_MOCK';
  endpointCalled?: string;
}

export class N8nClient {
  private primaryUrl: string;
  private testUrl: string;
  private timeoutMs: number;
  private mode: 'live' | 'mock';

  constructor() {
    this.primaryUrl =
      process.env.N8N_WEBHOOK_URL ||
      'http://localhost:5678/webhook/municipal-ticket-phase5';
    this.testUrl =
      process.env.N8N_TEST_WEBHOOK_URL ||
      'http://localhost:5678/webhook-test/municipal-ticket-phase5';
    this.timeoutMs = parseInt(process.env.N8N_TIMEOUT_MS || '4000', 10);
    this.mode = (process.env.N8N_MODE?.toLowerCase() === 'live' ? 'live' : 'mock') as 'live' | 'mock';
  }

  public getMode(): 'live' | 'mock' {
    return this.mode;
  }

  public setMode(newMode: 'live' | 'mock') {
    this.mode = newMode;
  }

  /**
   * Executes the municipal ticket workflow.
   * In 'live' mode: Must call real n8n webhook; NEVER silently switches to mock on failure.
   * In 'mock' mode: Explicitly runs the high-fidelity Phase 5 20-node simulator and visibly labels output.
   */
  public async executeWorkflow(report: MunicipalReportRequest): Promise<N8nExecutionResult> {
    if (this.mode === 'live') {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        let endpointUsed = this.primaryUrl;
        let res = await fetch(this.primaryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
          signal: controller.signal,
        });

        clearTimeout(timer);

        // If primary webhook is not active, check test webhook
        if (res.status === 404) {
          endpointUsed = this.testUrl;
          const testController = new AbortController();
          const testTimer = setTimeout(() => testController.abort(), this.timeoutMs);

          res = await fetch(this.testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report),
            signal: testController.signal,
          });

          clearTimeout(testTimer);
        }

        if (res.ok || res.status === 202 || res.status === 422) {
          const json = (await res.json()) as MunicipalReportResponse;
          return {
            response: {
              ...json,
              notice: 'REAL N8N WORKFLOW: Orchestrated by live n8n canvas instance.',
            },
            source: 'REAL_N8N_WEBHOOK',
            endpointCalled: endpointUsed,
          };
        }

        throw new Error(`Real n8n webhook returned HTTP ${res.status}: ${res.statusText}`);
      } catch (err: any) {
        // CRITICAL AUDIT RULE: Never silently switch to mock mode on live failure!
        console.error('❌ Live n8n webhook call failed:', err.message);
        throw new Error(
          `LIVE_N8N_FAILURE: Real n8n webhook at ${this.primaryUrl} failed (${err.message}). Silent fallback to mock is disabled in live mode.`
        );
      }
    }

    // Explicit Mock Mode
    const simulated = runPhase5Workflow(report);
    return {
      response: {
        ...simulated,
        notice:
          'EXPLICIT_SIMULATED_MOCK: Running internal Phase 5 20-node mock engine. No real AI vision or verified RAG retrieval claimed.',
      },
      source: 'EXPLICIT_SIMULATED_MOCK',
    };
  }
}

export const n8nClient = new N8nClient();
