import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatHours } from '@/lib/jira/live-hours'
import type { JiraMemberSummary } from '@/lib/jira/dashboard-types'

interface MemberHoursTableProps {
  members: JiraMemberSummary[]
}

export function MemberHoursTable({ members }: MemberHoursTableProps): React.JSX.Element {
  if (members.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        No time logged for this period.
      </p>
    )
  }

  const totalSeconds = members.reduce((sum, m) => sum + m.totalSeconds, 0)
  const totalHours = members.reduce((sum, m) => sum + m.totalHours, 0)
  const totalIssueCount = members.reduce((sum, m) => sum + m.issueCount, 0)

  return (
    <div>
      <p className="text-sm font-medium mb-3">Hours by Team Member</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team Member</TableHead>
            <TableHead className="text-right">Issues</TableHead>
            <TableHead className="text-right">Hours</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.accountId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">
                      {member.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{member.displayName}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-sm text-muted-foreground">{member.issueCount}</span>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-sm font-medium">{member.totalHours.toFixed(1)}h</span>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-xs text-muted-foreground">
                  {formatHours(member.totalSeconds)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="font-medium">
            <TableCell>Total</TableCell>
            <TableCell className="text-right">{totalIssueCount}</TableCell>
            <TableCell className="text-right">{totalHours.toFixed(1)}h</TableCell>
            <TableCell className="text-right">{formatHours(totalSeconds)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
