import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn, formatNumber, getShortAccountName } from '@/lib/utils';
import type { AccountTreeNode } from '@/types';
import { Button } from './ui/button';

interface AccountTreeTableProps {
  data: AccountTreeNode[];
  currencies: string[];
  primaryCurrency?: string;
  onAccountClick?: (account: string) => void;
}

interface TreeRowProps {
  node: AccountTreeNode;
  currencies: string[];
  primaryCurrency?: string;
  level: number;
  onAccountClick?: (account: string) => void;
}

function TreeRow({ node, currencies, primaryCurrency, level, onAccountClick }: TreeRowProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children.length > 0;
  const currency = primaryCurrency || currencies[0] || 'CNY';
  
  const balance = node.balance[currency] || 0;
  const balanceChildren = node.balance_children[currency] || 0;
  const totalBalance = balance + balanceChildren;
  
  const isNegative = totalBalance < 0;
  
  return (
    <div>
      <div 
        className={cn(
          "flex items-center py-2 px-4 hover:bg-muted/50 border-b border-border/50",
          level > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${level * 20 + 16}px` }}
      >
        <div className="flex items-center flex-1 min-w-0">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 mr-2 shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? '收起子账户' : '展开子账户'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          ) : (
            <span className="w-6 mr-2 shrink-0" aria-hidden="true" />
          )}
          <button
            onClick={() => onAccountClick?.(node.account)}
            className="text-left hover:text-primary hover:underline truncate min-w-0"
            title={node.account}
          >
            <span className="font-medium truncate">{getShortAccountName(node.account)}</span>
            {level === 0 && (
              <span className="text-muted-foreground ml-2 text-sm">
                ({node.account.split(':')[0]})
              </span>
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-8 shrink-0">
          {/* 直接余额 */}
          <div className={cn(
            "text-right w-32 font-mono text-sm",
            balance !== 0 && (balance > 0 ? "text-emerald-600" : "text-red-600")
          )}>
            {balance !== 0 ? formatNumber(balance) : '-'}
          </div>
          
          {/* 总余额（包含子账户） */}
          <div className={cn(
            "text-right w-32 font-mono text-sm font-medium",
            isNegative ? "text-red-600" : totalBalance > 0 ? "text-emerald-600" : "text-muted-foreground"
          )}>
            {formatNumber(Math.abs(totalBalance))}
          </div>
        </div>
      </div>
      
      {/* 子账户 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child, index) => (
            <TreeRow
              key={`${child.account}-${index}`}
              node={child}
              currencies={currencies}
              primaryCurrency={primaryCurrency}
              level={level + 1}
              onAccountClick={onAccountClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AccountTreeTable({ 
  data, 
  currencies, 
  primaryCurrency,
  onAccountClick 
}: AccountTreeTableProps) {
  const currency = primaryCurrency || currencies[0] || 'CNY';
  
  if (!data || data.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        <p>暂无账户数据</p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 表头 */}
      <div className="flex items-center py-3 px-4 bg-muted font-medium text-sm border-b">
        <div className="flex-1 min-w-0">账户</div>
        <div className="flex items-center gap-8 shrink-0">
          <div className="text-right w-32 text-muted-foreground">直接余额</div>
          <div className="text-right w-32 text-muted-foreground">
            总余额 ({currency})
          </div>
        </div>
      </div>
      
      {/* 表格内容 */}
      <div>
        {data.map((node, index) => (
          <TreeRow
            key={`${node.account}-${index}`}
            node={node}
            currencies={currencies}
            primaryCurrency={primaryCurrency}
            level={0}
            onAccountClick={onAccountClick}
          />
        ))}
      </div>
    </div>
  );
}
