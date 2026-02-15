import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface AccountPickerProps {
  accounts: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface TreeNode {
  name: string;
  fullPath: string;
  children: TreeNode[];
  isAccount: boolean;
}

function buildTree(accounts: string[]): TreeNode[] {
  const root: TreeNode[] = [];
  const accountSet = new Set(accounts);

  for (const account of accounts) {
    const parts = account.split(':');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const fullPath = parts.slice(0, i + 1).join(':');
      let existing = currentLevel.find(n => n.fullPath === fullPath);
      if (!existing) {
        existing = {
          name: parts[i],
          fullPath,
          children: [],
          isAccount: accountSet.has(fullPath),
        };
        currentLevel.push(existing);
      }
      currentLevel = existing.children;
    }
  }

  return root;
}

function TreeItem({
  node,
  depth,
  onSelect,
  searchTerm,
}: {
  node: TreeNode;
  depth: number;
  onSelect: (account: string) => void;
  searchTerm: string;
}) {
  const [expanded, setExpanded] = useState(depth < 1 || !!searchTerm);
  const hasChildren = node.children.length > 0;

  useEffect(() => {
    if (searchTerm) setExpanded(true);
  }, [searchTerm]);

  const matchesSearch = !searchTerm ||
    node.fullPath.toLowerCase().includes(searchTerm.toLowerCase());

  const childrenMatch = !searchTerm ||
    node.children.some(c =>
      c.fullPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hasDescendantMatch(c, searchTerm)
    );

  if (searchTerm && !matchesSearch && !childrenMatch) return null;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-2 text-sm cursor-pointer rounded hover:bg-primary/10 transition-colors'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.fullPath)}
      >
        {hasChildren ? (
          <button
            className="p-0 h-4 w-4 shrink-0 text-muted-foreground"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className="truncate">
          {node.name}
        </span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeItem
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function hasDescendantMatch(node: TreeNode, term: string): boolean {
  return node.children.some(c =>
    c.fullPath.toLowerCase().includes(term.toLowerCase()) ||
    hasDescendantMatch(c, term)
  );
}

export function AccountPicker({ accounts, value, onChange, placeholder, className }: AccountPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const tree = useMemo(() => buildTree(accounts), [accounts]);

  const filteredAccounts = useMemo(() => {
    if (!search) return [];
    return accounts
      .filter(a => a.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 12);
  }, [accounts, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (account: string) => {
    onChange(account);
    setOpen(false);
    setSearch('');
  };

  const displayValue = value || '';
  const shortDisplay = displayValue ? displayValue.split(':').slice(-2).join(':') : '';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'flex h-8 w-full items-center rounded-md border border-input bg-background px-3 py-1 text-sm',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          !value && 'text-muted-foreground'
        )}
        onClick={() => setOpen(!open)}
        title={displayValue}
      >
        <span className="truncate font-mono text-xs">
          {shortDisplay || placeholder || '选择账户...'}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 w-80 mt-1 bg-card border rounded-md shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="搜索账户..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 pl-7 text-xs"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {search ? (
              filteredAccounts.length > 0 ? (
                filteredAccounts.map(a => (
                  <button
                    key={a}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted font-mono truncate"
                    onClick={() => handleSelect(a)}
                  >
                    {a}
                  </button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">无匹配账户</p>
              )
            ) : (
              tree.map(node => (
                <TreeItem
                  key={node.fullPath}
                  node={node}
                  depth={0}
                  onSelect={handleSelect}
                  searchTerm={search}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
