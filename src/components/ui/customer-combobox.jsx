import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * CustomerCombobox - Searchable customer selector
 * Supports searching by: name, customer code, phone, email, TC, VKN
 */
export function CustomerCombobox({
  customers = [],
  value,
  onChange,
  placeholder = "Müşteri seçiniz...",
  disabled = false
}) {
  const [open, setOpen] = React.useState(false)

  // Find selected customer
  const selectedCustomer = React.useMemo(
    () => customers.find((customer) => customer.id === value),
    [customers, value]
  )

  // Format customer display name with additional info
  const getCustomerDisplay = (customer) => {
    const parts = []

    if (customer.profile?.full_name) {
      parts.push(customer.profile.full_name)
    }

    if (customer.customer_code) {
      parts.push(`(${customer.customer_code})`)
    }

    return parts.join(' ') || customer.id
  }

  // Get searchable text for a customer
  const getSearchableText = (customer) => {
    const parts = [
      customer.customer_code,
      customer.profile?.full_name,
      customer.profile?.email,
      customer.profile?.phone,
      customer.profile?.tc_no,
      customer.profile?.vkn,
      customer.profile?.company_name,
    ]

    return parts.filter(Boolean).join(' ').toLowerCase()
  }

  // Custom filter function for Command
  const filterCustomers = (value, search) => {
    if (!search) return 1

    const customer = customers.find(c => c.id === value)
    if (!customer) return 0

    const searchLower = search.toLowerCase()
    const searchableText = getSearchableText(customer)

    return searchableText.includes(searchLower) ? 1 : 0
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCustomer ? (
            <span className="truncate">{getCustomerDisplay(selectedCustomer)}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command filter={filterCustomers}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Ad, TC, telefon, email ile ara..."
              className="h-9"
            />
          </div>
          <CommandList>
            <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {customer.profile?.full_name || 'İsimsiz'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {customer.customer_code}
                      {customer.profile?.phone && ` • ${customer.profile.phone}`}
                      {customer.profile?.email && ` • ${customer.profile.email}`}
                    </div>
                    {(customer.profile?.tc_no || customer.profile?.vkn) && (
                      <div className="text-xs text-muted-foreground truncate">
                        {customer.profile?.tc_no && `TC: ${customer.profile.tc_no}`}
                        {customer.profile?.vkn && `VKN: ${customer.profile.vkn}`}
                      </div>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
