import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MessageSquare, Phone, BookOpen, ArrowRight } from 'lucide-react'
import { toast } from '@/lib/toast'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: 'sales',
    message: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success('Message sent successfully!', {
      description: 'We will get back to you within 2 business hours.',
    })
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      department: 'sales',
      message: '',
    })
  }

  return (
    <section className="py-16 bg-background">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left: Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-2">Send us a message</h2>
              <p className="text-muted-foreground mb-8">
                Fill out the form below and we will get back to you within 2 business hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Department */}
                <div>
                  <Label>Inquiry Department</Label>
                  <RadioGroup
                    value={formData.department}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department: value })
                    }
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sales" id="sales" />
                      <Label htmlFor="sales" className="cursor-pointer font-normal">
                        Sales
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="technical" id="technical" />
                      <Label htmlFor="technical" className="cursor-pointer font-normal">
                        Technical
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="billing" id="billing" />
                      <Label htmlFor="billing" className="cursor-pointer font-normal">
                        Billing
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help your business today?"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={6}
                    required
                  />
                </div>

                {/* Submit */}
                <div>
                  <Button type="submit" size="lg" className="w-full">
                    Send a Message
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    By submitting this form, you agree to our privacy policy and terms of service.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Immediate Support */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Immediate Support</h3>
              <p className="text-sm text-muted-foreground">
                Skip the queue with our real-time channels.
              </p>
            </div>

            {/* Live Chat */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-bold mb-2">Live Chat</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Average response time: &lt; 30 seconds. Perfect for quick technical fixes.
              </p>
              <a
                href="#"
                className="text-primary text-sm font-medium inline-flex items-center gap-1 hover:underline"
              >
                Launch Chat <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Phone Support */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-bold mb-2">Phone Support</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Available 24/7 for enterprise customers. Direct line to senior engineers.
              </p>
              <a
                href="#"
                className="text-primary text-sm font-medium inline-flex items-center gap-1 hover:underline"
              >
                View Numbers <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Documentation */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-bold mb-2">Documentation</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Step-by-step guides for API integrations, server setup, and migrations.
              </p>
              <a
                href="#"
                className="text-primary text-sm font-medium inline-flex items-center gap-1 hover:underline"
              >
                Visit Knowledge Base <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* All Systems Operational */}
            <div className="text-center pt-6">
              <p className="font-bold mb-1">All Systems Operational</p>
              <p className="text-sm text-muted-foreground">
                Our global network is performing optimally
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
